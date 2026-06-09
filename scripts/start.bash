#!/usr/bin/env bash
# spell-checker: ignore pipefail SIGINT prereqs prereq
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

source "$(ts-utils which init-constants-script)"

all_packages=$("$project_dir/scripts/package-order.bash")
prereq_packages=$("$project_dir/scripts/package-order.bash" --prereqs)

function start() {
  # build prerequisite packages so their outputs exist for dependents
  for package in $prereq_packages; do
    label="${package##*/}"
    echo "building prerequisite $package ..."
    npm --workspace="$package" run build 2>&1 | sed "s/^/[$label] /"
  done

  # looping instead of running `npm run start --workspaces`
  # so that each command can be sent to background
  for package in $all_packages; do
    label="${package##*/}"
    echo "checking startup commands in $package ..."
    npm --workspace="$package" --silent run data:seed --if-present 2>&1 | sed "s/^/[$label] /" || true
    echo "starting $package ..."
    npm --workspace="$package" run start 2>&1 | sed "s/^/[$label] /" &
  done

  # wait for ctrl-c
  read -r -d '' _ </dev/tty
}

(trap 'kill 0' SIGINT EXIT; start)
