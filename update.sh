#!/usr/bin/env bash
#
# update the SDK and run the extraction process
#

set -o errexit
set -o pipefail
set -o nounset

VERSION=${1:-latest}

if [ ! -d "node_modules" ]; then
  npm install
fi

if [ ! -d "docs/images" ]; then
  mkdir -p docs/images
fi

npm install @paypal/sdk-logos@$VERSION

npx ts-node src/extract.ts

if [ "${GITHUB_ACTIONS:-false}" == "true" ]; then
    git add docs/images/*.svg
fi

echo "INFO: complete at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

