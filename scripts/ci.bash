#!/usr/bin/env bash
# spell-checker: ignore pipefail yargs mkdir
set -euo pipefail; if [ -n "${DEBUG-}" ]; then set -x; fi

project_dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

cd "$project_dir"

npx cspell -c ./cspell.json "**"
