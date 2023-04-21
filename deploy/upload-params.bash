#!/usr/bin/env bash
# spell-checker: ignore pipefail
set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "$SCRIPT_DIR/bin/init-params-script.bash"

# List all parameter names to upload here
PARAMS=(
  EncryptionPrivateKey # for decrypt authorization
  SignaturePublicKey # for decrypt authorization
)

environment=$(getArg 0)

if [ -z "$environment" ]; then
  cat <<HEREDOC
  Usage: $(basename ${BASH_SOURCE[0]}) <environment> [options]

  Uploads secret values from your environment to the AWS parameter store with proper tags

  Options:
    -o - overwrite existing parameters - default: don't overwrite
    -p - upload set parameters, even if some are missing - default: abort if any are missing
    -r - set AWS region - default: us-east-1

HEREDOC

  exit 1
fi

overwrite=$(getKwarg o)
partial=$(getKwarg p)

# Check if any params are missing
params_with_value=
for param in ${PARAMS[@]}; do
  if [ -n "${!param:-}" ]; then
    params_with_value="$params_with_value $param"
  else
    if [ -n "$partial" ]; then
      echo "\"$param\" not uploaded as it is not set or not exported in your environment"
    else
      echo "\"$param\" is not set or not exported in your environment"
      printf "Please set it first or use the -p option to upload only defined variables\n\n"
      exit 1
    fi
  fi
done

if [ -z "$params_with_value" ]; then
  printf '\nAborting: None of the parameters that could be uploaded have values\n\n'
  exit 1
fi

for param in $params_with_value; do
  name="/$APPLICATION/$environment/api/$param"

  value="${!param}"

  upload_parameter
done

printf "\nSuccessfully uploaded ${partial:+partial }parameters for $environment-$APPLICATION\n\n"
