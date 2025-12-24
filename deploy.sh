#!/bin/bash
# Auto-versioning deploy script for MicroQuickJS WASM
# Updates version in all files before deploying

set -e

# Get current version number and increment
VERSION_FILE="version.txt"
if [ -f "$VERSION_FILE" ]; then
    VERSION_NUM=$(cat "$VERSION_FILE")
else
    VERSION_NUM=1
fi

# Get today's date
DATE=$(date +%Y%m%d)

# Build version string
VERSION="${DATE}_v${VERSION_NUM}"

echo "Deploying version: $VERSION"

# Update version in all files
sed -i '' "s/BUILD_VERSION = '[^']*'/BUILD_VERSION = '${VERSION}'/g" dist/ide.js
sed -i '' "s/BUILD_VERSION = '[^']*'/BUILD_VERSION = '${VERSION}'/g" dist/benchmark.js
sed -i '' "s/content=\"[0-9]*_v[0-9]*\"/content=\"${VERSION}\"/g" dist/index.html
sed -i '' "s/content=\"[0-9]*_v[0-9]*\"/content=\"${VERSION}\"/g" dist/benchmark.html
sed -i '' "s/?v=[0-9]*_v[0-9]*/?v=${VERSION}/g" dist/index.html
sed -i '' "s/?v=[0-9]*_v[0-9]*/?v=${VERSION}/g" dist/benchmark.html

# Update header badge (v10 -> vN)
sed -i '' "s/>v[0-9]*</>v${VERSION_NUM}</g" dist/index.html
sed -i '' "s/>v[0-9]*</>v${VERSION_NUM}</g" dist/benchmark.html

# Update README
sed -i '' "s/version-v[0-9]*-green/version-v${VERSION_NUM}-green/g" README.md
sed -i '' "s/Current Version:\*\* v[0-9]* ([0-9\-]*)/Current Version:** v${VERSION_NUM} ($(date +%Y-%m-%d))/g" README.md

# Deploy
wrangler pages deploy ./dist --project-name=mquickjs-claude-code

# Increment version for next deploy
NEXT_VERSION=$((VERSION_NUM + 1))
echo "$NEXT_VERSION" > "$VERSION_FILE"

echo ""
echo "Deployed v${VERSION_NUM} (${VERSION})"
echo "Next version will be v${NEXT_VERSION}"
