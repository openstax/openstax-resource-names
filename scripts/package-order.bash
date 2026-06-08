#!/usr/bin/env bash
# spell-checker: ignore pipefail prereqs readdir
# Outputs workspace package names in build-dependency order.
# Packages with build-order dependencies are listed first,
# followed by all remaining packages.
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

# packages that must be built before other ones (in this order)
# trying to be graceful about the template being copied and packages
# getting removed without requiring updating the world
build_order=("@openstax/orn-locator")
test -d ./packages/utils/ && build_order+=("@openstax/ts-utils")
test -d ./packages/lambda/ && build_order+=("@project/lambdas")

# all other packages
all_packages=$(node -e "process.stdout.write(require('fs').readdirSync('./packages').map(d=>{try{return require('./packages/'+d+'/package.json').name}catch(e){return null}}).filter(Boolean).join(' '))")
remaining_packages=$(echo "${build_order[@]}" "$all_packages" | tr ' ' '\n' | sort | uniq -u)

if ts-utils has-flag prereqs "$@"; then
  for package in "${build_order[@]}"; do
    echo "$package"
  done
else
  for package in "${build_order[@]}" $remaining_packages; do
    echo "$package"
  done
fi
