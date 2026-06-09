#!/usr/bin/env bash
# spell-checker: ignore pipefail, VITE
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
PROJECT_DIR=$( cd -- "$SCRIPT_DIR/.." &> /dev/null && pwd )
cd "$PROJECT_DIR"

if [ -z "${ENVIRONMENT:-}" ]; then echo "run this command with 'npx ts-utils deploy' instead of executing it directly" > /dev/stderr; exit 1; fi

timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
gitVersion=$(git rev-parse HEAD)
stackName="$ENVIRONMENT-$APPLICATION"

# =======
# shared setup is one per aws account for this project, currently only used for
# lambda code zip archives and SNS topics for PagerDuty notifications
# =======
if ! ts-utils stack-exists "subdomain-$APPLICATION-dns"; then
  echo 'DNS stack not found. create one by following the instructions here: https://github.com/openstax/subdomains' > /dev/stderr
  exit 1
fi
if ! ts-utils stack-exists "subdomain-$APPLICATION-cert"; then
  echo 'SSL cert stack not found. create one by following the instructions here: https://github.com/openstax/subdomains' > /dev/stderr
  exit 1
fi

pagerDutyAnytimeEndpoint=$(aws ssm get-parameter --name "/external/pager_duty/$APPLICATION/anytime_endpoint" \
   --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || true)
pagerDutyWorkdayEndpoint=$(aws ssm get-parameter --name "/external/pager_duty/$APPLICATION/workday_endpoint" \
   --with-decryption --query 'Parameter.Value' --output text 2>/dev/null || true)

if [ -z "$pagerDutyAnytimeEndpoint" ] || [ -z "$pagerDutyWorkdayEndpoint" ]; then
  echo "Warning: PagerDuty endpoint(s) not set. You can set them by running: 'npx ts-utils upload-pager-duty-endpoints'" > /dev/stderr
fi

npm install

if [ -n "$(git status --porcelain=v1 2>/dev/null)" ]; then
  echo "please stash, commit, gitignore, or reset your changes before deploying" > /dev/stderr
  exit 1
fi

bucketPrefix=
if [ "$AWS_ACCOUNT" != "openstax" ]; then
  bucketPrefix="$AWS_ACCOUNT-"
fi

aws cloudformation deploy \
  --region "$AWS_DEFAULT_REGION" \
  --no-fail-on-empty-changeset \
  --template-file "$SCRIPT_DIR/shared.cfn.yml" \
  --stack-name "$APPLICATION-shared" \
  --parameter-overrides "BucketPrefix=$bucketPrefix" \
    "PagerDutyAnytimeEndpoint=$pagerDutyAnytimeEndpoint" \
    "PagerDutyWorkdayEndpoint=$pagerDutyWorkdayEndpoint" \
  --tags "Project=$PROJECT" "Application=$APPLICATION" 'Environment=shared' "Owner=$OWNER"

codeBucket=$(ts-utils get-stack-param "$APPLICATION-shared" BucketName)

# =======
# build utils code if the package exists in this repo
# =======
if [ -d "$PROJECT_DIR/packages/utils" ]; then
  cd "$PROJECT_DIR/packages/utils"
  npm run build:clean
fi

# =======
# build locator code
# =======
cd "$PROJECT_DIR/packages/orn-locator"

npm run build:clean && node script/preload-data.js

# =======
# build api code and upload to code bucket
# =======
cd "$PROJECT_DIR/packages/lambda"

export CODE_VERSION="$gitVersion"
export APPLICATION;

npm run archive:clean

apiCodeKey="api-$timestamp.zip"
aws s3 cp "dist/serviceApi.zip" "s3://$codeBucket/$apiCodeKey"

# =======
# build frontend and upload to static site bucket
# =======
cd "$PROJECT_DIR/packages/frontend"

export VITE_CODE_VERSION="$CODE_VERSION"
export VITE_APP_NAME="$APPLICATION"
export PUBLIC_URL="/build"

# =======
# try to read domainName from the stack
# =======
if ts-utils stack-exists "$stackName"; then
  previouslyDeployed=1
  bucketName=$(ts-utils get-stack-param "$stackName" StaticBucketName)
  domainName=$(ts-utils get-stack-param "$stackName" DistributionDomainName)
  export VITE_API_BASE_URL="https://${domainName}"
  npm run build:clean
  aws s3 sync build "s3://${bucketName}${PUBLIC_URL}" --region "$AWS_DEFAULT_REGION"
else
  previouslyDeployed=0
fi

cd "$PROJECT_DIR"

# Get values from SSM parameters
cookieName=$(ts-utils get-env-param "$ENVIRONMENT" "CookieName")
accountsBase=$(ts-utils get-env-param "$ENVIRONMENT" "AccountsBase")
signaturePublicKey=$(ts-utils get-env-param "$ENVIRONMENT" "SignaturePublicKey")
searchHost=$(ts-utils get-env-param "$ENVIRONMENT" "SearchHost")

cd "$PROJECT_DIR/packages/lambda"

# =======
# main deployment includes alt region for fail over
# =======
aws cloudformation deploy \
  --region "$AWS_ALT_REGION" \
  --no-fail-on-empty-changeset \
  --template-file "$SCRIPT_DIR/deployment-alt-region.cfn.yml" \
  --stack-name "$stackName" \
  --parameter-overrides "BucketPrefix=$bucketPrefix" \
  --tags "Project=$PROJECT" "Application=$APPLICATION" "Environment=$ENVIRONMENT" "Owner=$OWNER"

# cloudformation cannot reference exports across regions, so these are applied like this
replicaBucketWebsiteURL=$(AWS_DEFAULT_REGION="$AWS_ALT_REGION" ts-utils get-stack-param "$stackName" ReplicaBucketWebsiteURL)

aws cloudformation deploy \
  --region "$AWS_DEFAULT_REGION" \
  --template-file "$SCRIPT_DIR/deployment.cfn.yml" \
  --stack-name "$stackName" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides "BucketPrefix=$bucketPrefix" "CodeBucket=$codeBucket" \
    "EnvName=$ENVIRONMENT" "Application=$APPLICATION" "ReplicaBucketWebsiteURL=$replicaBucketWebsiteURL" \
    "ApiCodeKey=$apiCodeKey" \
    "AccountsBase=$accountsBase" "CookieName=$cookieName" "SignaturePublicKey=$signaturePublicKey" \
    "SearchHost=$searchHost" \
  --tags "Project=$PROJECT" "Application=$APPLICATION" "Environment=$ENVIRONMENT" "Owner=$OWNER"

bucketName=$(ts-utils get-stack-param "$stackName" StaticBucketName)
domainName=$(ts-utils get-stack-param "$stackName" DistributionDomainName)
distributionId=$(ts-utils get-stack-param "$stackName" DistributionId)

# =======
# build frontend and upload to static site bucket
# =======
export VITE_API_BASE_URL="https://${domainName}"

cd "$PROJECT_DIR/packages/frontend"
if [ $previouslyDeployed -eq 0 ]; then
  npm run build:clean
fi
aws s3 sync build "s3://${bucketName}${PUBLIC_URL}" --delete --region "$AWS_DEFAULT_REGION"

aws cloudfront create-invalidation --distribution-id "$distributionId" --paths "/*" --output text --query "Invalidation.Status"

# =======
# trigger SBOM emission for this environment (best-effort; deploy already succeeded)
# uses developer's local gh auth — no inventory write happens from this machine.
# =======
gh workflow run sbom.yml -F ref="$ENVIRONMENT" -F sha="$gitVersion" \
  || echo "warning: failed to trigger SBOM emission workflow" > /dev/stderr

# =======
# done
# =======
echo "deployed: $domainName";
