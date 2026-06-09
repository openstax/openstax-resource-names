#!/usr/bin/env bash
# spell-checker: ignore pipefail
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

all_packages=$("$project_dir/scripts/package-order.bash")

# build em
for package in $all_packages; do
  label="${package##*/}"
  echo "building $package ..."
  npm --workspace="$package" run build:clean 2>&1 | sed "s/^/[$label] /"
done
