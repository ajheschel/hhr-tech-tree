#!/usr/bin/env bash

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/techtree-data.json" >&2
  exit 64
fi

source_file=$1
if [[ ! -f "$source_file" ]]; then
  echo "Data file not found: $source_file" >&2
  exit 66
fi

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
destination="$repository_root/src/app/api/inventions/techtree-data.json"

mkdir -p "$(dirname "$destination")"
cp -- "$source_file" "$destination"

echo "Installed private tech-tree data at: $destination"
echo "This destination is ignored by Git and must not be committed."
