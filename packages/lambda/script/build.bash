#!/usr/bin/env bash
# spell-checker: ignore pipefail yargs
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir";

build_dir="build"
tsc_args=(--noEmit false --outDir "$build_dir" --declaration --allowJs )

if yarn -s ts-utils has-flag watch "$@"; then
  tsc_args+=(--watch)
fi
if yarn -s ts-utils has-flag clean "$@"; then
  rm -rf "${build_dir:?}"/*
fi

yarn -s tsc "${tsc_args[@]}"
