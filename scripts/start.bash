#!/usr/bin/env bash
# spell-checker: ignore pipefail SIGINT
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

source $(yarn -s ts-utils which init-constants-script)

./scripts/build.bash

all_packages=$(yarn --silent workspaces info | node -e "process.stdout.write(Object.keys(JSON.parse(require('fs').readFileSync('/dev/stdin').toString())).join(' '))")

function start() {
  # looping instead of running `yarn workspaces run start`
  # so that each command can be sent to background
  for package in $all_packages; do
    label="${package##*/}"
    echo "checking startup commands in $package ..."
    yarn --silent workspace "$package" run data:seed 2>&1 | sed "s/^/[$label] /" || true
    echo "starting $package ..."
    yarn workspace "$package" start 2>&1 | sed "s/^/[$label] /" &
  done

  # wait for ctrl-c
  read -r -d '' _ </dev/tty
}

(trap 'kill 0' SIGINT EXIT; start)
