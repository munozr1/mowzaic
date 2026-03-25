#!/bin/bash
#tesing

# Vercel Ignored Build Step
# https://vercel.com/docs/projects/overview#ignored-build-step
#
# Exit 1 = proceed with build
# Exit 0 = skip build

echo "Checking for changes in mowzaic_frontend/ and api/..."

# Compare HEAD with the previous commit for changes in frontend or api
git diff --quiet HEAD^ HEAD -- mowzaic_frontend/ api/ vercel.json

if [ $? -eq 0 ]; then
  echo "✅ No changes in mowzaic_frontend/ or api/ — skipping build."
  exit 0
else
  echo "🔨 Changes detected — proceeding with build."
  exit 1
fi
