#!/usr/bin/env bash
# spell-checker: ignore pipefail yargs
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir";

args=("$@")
function hasArg() {
  # https://stackoverflow.com/a/61551944/14809536
  node -e "if (!require('yargs').argv['$1']) { process.exit(1) }" -- yargs "${args[@]+"${args[@]}"}"
}

build_dir="build"
tsc_args=(--noEmit false --outDir "$build_dir" --declaration --allowJs )

if hasArg watch; then
  tsc_args+=(--watch)
fi
if hasArg clean; then
  rm -rf "${build_dir:?}"/*
fi

yarn tsc "${tsc_args[@]}"
