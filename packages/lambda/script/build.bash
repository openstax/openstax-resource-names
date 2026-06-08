#!/usr/bin/env bash
# spell-checker: ignore pipefail yargs
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir";

export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=8192"

build_dir="build"
tsc_args=(--noEmit false --outDir "$build_dir" --declaration --allowJs --preserveWatchOutput)

if yarn -s ts-utils has-flag clean "$@"; then
  rm -rf "${build_dir:?}"/*
fi

if yarn -s ts-utils has-flag watch "$@"; then
  yarn -s tsc-watch --noClear "${tsc_args[@]}" --onSuccess "node script/utils/generateRouteData.js"
else
  yarn -s tsc "${tsc_args[@]}"
  node script/utils/generateRouteData.js
fi
