#!/usr/bin/env bash
# spell-checker: ignore pipefail
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

# packages that must be built before other ones (in this order)
# trying to be graceful about the template being copied and packages
# getting removed without requiring updating the world
build_order=("@openstax/orn-locator")
test -d ./packages/lambda/ && build_order+=("@project/lambdas")

# all other packages
all_packages=$(yarn --silent workspaces info | node -e "process.stdout.write(Object.keys(JSON.parse(require('fs').readFileSync('/dev/stdin').toString())).join(' '))")
remaining_packages=$(echo "${build_order[@]}" "$all_packages" | tr ' ' '\n' | sort | uniq -u)

# build em
for package in "${build_order[@]}" $remaining_packages; do
  echo "building $package ..."
  yarn workspace "$package" build:clean
done
