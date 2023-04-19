#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "$SCRIPT_DIR/constants.env"

if [ "$#" -lt 1 ]; then
  cat <<HEREDOC

  Usage: $(basename ${BASH_SOURCE[0]}) <environment>

  Deploys the given $APPLICATION environment

HEREDOC

  exit 1
fi

timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PATH="$PATH:$SCRIPT_DIR/bin"
gitVersion=$(git rev-parse HEAD)
stackName="$1-$APPLICATION"

export SANDBOX_AWS=373045849756
export PRODUCTION_AWS=624276253531

accountId=$(aws sts get-caller-identity --output json | jq -r '.Account')
if [ "$accountId" == "373045849756" ]; then # sandbox account
  bucketPrefix=sandbox-
  export REACT_APP_ACCOUNTS_URL='https://dev.openstax.org/'
elif [ "$accountId" == "624276253531" ]; then # production account
  bucketPrefix=
  export REACT_APP_ACCOUNTS_URL='https://openstax.org/'
else
  echo "authorized aws account id is not recognized, make sure you're logged in" > /dev/stderr
  exit 1
fi

if ! stack-exists "subdomain-$APPLICATION-dns"; then
  echo 'DNS stack not found. create one by following the instructions here: https://github.com/openstax/subdomains' > /dev/stderr
  exit 1
fi
if ! stack-exists "subdomain-$APPLICATION-cert"; then
  echo 'SSL cert stack not found. create one by following the instructions here: https://github.com/openstax/subdomains' > /dev/stderr
  exit 1
fi

# =======
# shared stack is one per aws account for this project, currently only used for
# lambda code zip archives and SNS topics for PagerDuty notifications
# =======
pagerDutyAnytimeEndpoint=$(aws ssm get-parameter --name /external/pager_duty/$APPLICATION/anytime_endpoint \
                                                 --with-decryption --query 'Parameter.Value' --output text)
pagerDutyWorkdayEndpoint=$(aws ssm get-parameter --name /external/pager_duty/$APPLICATION/workday_endpoint \
                                                 --with-decryption --query 'Parameter.Value' --output text)
aws cloudformation deploy \
  --region "$AWS_DEFAULT_REGION" \
  --no-fail-on-empty-changeset \
  --template-file "$SCRIPT_DIR/shared.cfn.yml" \
  --stack-name "$APPLICATION-shared" \
  --parameter-overrides "BucketPrefix=$bucketPrefix" \
    "PagerDutyAnytimeEndpoint=$pagerDutyAnytimeEndpoint" \
    "PagerDutyWorkdayEndpoint=$pagerDutyWorkdayEndpoint" \
  --tags "Project=$PROJECT" "Application=$APPLICATION" 'Environment=shared' "Owner=$OWNER"

codeBucket=$(get-stack-param "$APPLICATION-shared" BucketName)

# =======
# build utils code if the package exists in this repo
# =======
if [ -d "$SCRIPT_DIR"/../packages/utils ]; then
  cd "$SCRIPT_DIR"/../packages/utils
  yarn build:clean
fi

# =======
# build api code and upload to code bucket
# =======
cd "$SCRIPT_DIR"/../packages/lambda

export CODE_VERSION="$gitVersion"
export APPLICATION;

yarn archive:clean

apiCodeKey="api-$timestamp.zip"
aws s3 cp "dist/serviceApi.zip" "s3://$codeBucket/$apiCodeKey"

# =======
# main deployment includes alt region for failovers
# =======
aws cloudformation deploy \
  --region "$AWS_ALT_REGION" \
  --no-fail-on-empty-changeset \
  --template-file "$SCRIPT_DIR/deployment-alt-region.cfn.yml" \
  --stack-name "$stackName" \
  --tags "Project=$PROJECT" "Application=$APPLICATION" "Environment=$1" "Owner=$OWNER"

reactAppConfigExampleMessage="hello from /api/v0/info"
# clouformation cannot reference exports across regions, so these are applied like this
replicaBucketWebsiteURL=$(AWS_DEFAULT_REGION="$AWS_ALT_REGION" get-stack-param "$stackName" ReplicaBucketWebsiteURL)

aws cloudformation deploy \
  --region "$AWS_DEFAULT_REGION" \
  --template-file "$SCRIPT_DIR/deployment.cfn.yml" \
  --stack-name "$stackName" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides "CodeBucket=$codeBucket" "ApiCodeKey=$apiCodeKey" "EnvName=$1" "Application=$APPLICATION" "ReactAppConfigExampleMessage=$reactAppConfigExampleMessage" "ReplicaBucketWebsiteURL=$replicaBucketWebsiteURL" \
  --tags "Project=$PROJECT" "Application=$APPLICATION" "Environment=$1" "Owner=$OWNER"

bucketName=$(get-stack-param "$stackName" StaticBucketName)
domainName=$(get-stack-param "$stackName" DistributionDomainName)
distributionId=$(get-stack-param "$stackName" DistributionId)

# =======
# build frontend and upload to static site bucket
# =======
cd "$SCRIPT_DIR"/../packages/frontend

export REACT_APP_API_BASE_URL="https://${domainName}"
export PUBLIC_URL="/build"

yarn build:clean

aws s3 sync build "s3://${bucketName}${PUBLIC_URL}" --delete --region "$AWS_DEFAULT_REGION"

aws cloudfront create-invalidation --distribution-id "$distributionId" --paths "/*" --output text --query "Invalidation.Status"

# =======
# done
# =======
echo "deployed: $domainName";
