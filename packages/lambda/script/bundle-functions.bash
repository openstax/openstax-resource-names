#!/usr/bin/env bash
set -euo pipefail

base=$(pwd)

for fn in dist/*; do
  cd "$base/$fn"
  zip="../$(basename "$fn").zip"
  zip -r "$zip" .
done
