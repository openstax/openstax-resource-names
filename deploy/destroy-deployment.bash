#!/usr/bin/env bash
# spell-checker: ignore pipefail
set -euo pipefail

if [ -z "${ENVIRONMENT:-}" ]; then echo "run this command with 'yarn -s ts-utils destroy-deployment' instead of executing it directly" > /dev/stderr; exit 1; fi

if [ -z "$YES" ]; then
  echo "you have 5 seconds to cancel this before we start deleting things. this can be disabled by specifying '-y'";
  sleep 5;
fi

stackName="$ENVIRONMENT-$APPLICATION"

primaryBucket=$(yarn -s ts-utils get-stack-param "$stackName" StaticBucketName)
replicaBucket=$(AWS_DEFAULT_REGION="$AWS_ALT_REGION" yarn -s ts-utils get-stack-param "$stackName" ReplicaBucketName)

if [ -n "$primaryBucket" ]; then yarn -s ts-utils empty-bucket "$primaryBucket"; fi;
if [ -n "$replicaBucket" ]; then yarn -s ts-utils empty-bucket "$replicaBucket"; fi;

yarn -s ts-utils delete-stack "$stackName" "$AWS_ALT_REGION"
yarn -s ts-utils delete-stack "$stackName" "$AWS_DEFAULT_REGION"

echo "done."
