#!/bin/bash

# Generate Release Notes script for PromptLab
# This script generates structured release notes from git commits since the last tag

# Get the latest tag
LATEST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -z "$LATEST_TAG" ]; then
  # If no tags exist, get all commits
  CHANGES=$(git log --pretty=format:"- %s (%h)" --no-merges)
else
  # Get commits since the latest tag
  CHANGES=$(git log ${LATEST_TAG}..HEAD --pretty=format:"- %s (%h)" --no-merges)
fi

# Format changes into release notes with categories
cat << EOF
## What's Changed

### New Features
$(echo "$CHANGES" | grep -i "feat\|feature\|add" || echo "- No new features in this release")

### Bug Fixes
$(echo "$CHANGES" | grep -i "fix\|bug\|issue\|resolve" || echo "- No bug fixes in this release")

### Improvements
$(echo "$CHANGES" | grep -i "improve\|update\|enhance\|optimize\|refactor" || echo "- No improvements in this release")

### Other Changes
$(echo "$CHANGES" | grep -v -i "feat\|feature\|add\|fix\|bug\|issue\|resolve\|improve\|update\|enhance\|optimize\|refactor" || echo "- No other changes in this release")
EOF