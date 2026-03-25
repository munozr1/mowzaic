#!/bin/bash
#tesing

# Vercel Ignored Build Step
# https://vercel.com/docs/projects/overview#ignored-build-step
#
# Exit 1 = proceed with build
# Exit 0 = skip build

echo "Checking for changes in mowzaic_frontend..."

# Compare HEAD with the previous commit for changes in mowzaic_frontend/
git diff --quiet HEAD^ HEAD -- mowzaic_frontend/

if [ $? -eq 0 ]; then
  echo "✅ No changes in mowzaic_frontend — skipping build."
  exit 0
else
  echo "🔨 Changes detected in mowzaic_frontend — proceeding with build."
  exit 1
fi
