#!/usr/bin/env bash
# spell-checker: ignore pipefail
set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

source "$SCRIPT_DIR/bin/init-params-script.bash"

# List all configured PagerDuty endpoints here
ENDPOINTS=(
  anytime
  workday
)

help=$(getKwarg h)

if [ -n "$help" ]; then
  cat <<HEREDOC
  Usage: $(basename ${BASH_SOURCE[0]}) [options]

  Uploads PagerDuty endpoints to the AWS parameter store with proper tags

  Options:
    -h - display this help message and exit
    -r - set AWS region - default: us-east-1

HEREDOC

  exit 1
fi

interactive=true
environment=shared

for endpoint in ${ENDPOINTS[@]}; do
  name="/external/pager_duty/$APPLICATION/${endpoint}_endpoint"

  upload_parameter

  echo
done

printf "\nDone uploading PagerDuty endpoints for $APPLICATION\n\n"
