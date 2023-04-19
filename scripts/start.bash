#!/usr/bin/env bash
# spell-checker: ignore pipefail
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

./scripts/build.bash

all_packages=$(yarn --silent workspaces info | node -e "process.stdout.write(Object.keys(JSON.parse(require('fs').readFileSync('/dev/stdin').toString())).join(' '))")

function start() {
  # looping instead of running `yarn workspaces run start`
  # so that each command can be backgrounded
  for package in $all_packages; do
    echo "checking startup commands in $package ..."
    yarn --silent workspace "$package" run data:seed 2>&1 || true
    echo "starting $package ..."
    yarn workspace "$package" start &
  done

  # wait for ctrl-c
  read -r -d '' _ </dev/tty
}

(trap 'kill 0' SIGINT EXIT; start)
