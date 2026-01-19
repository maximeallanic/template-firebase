#!/bin/bash
set -e

# Version bump script for SpicyVSSweet
# Updates version in: package.json, android/app/build.gradle, ios/App/App.xcodeproj/project.pbxproj

BUMP_TYPE=${1:-patch}  # patch, minor, major

# Get current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Calculate new version
case $BUMP_TYPE in
  major)
    NEW_MAJOR=$((MAJOR + 1))
    NEW_MINOR=0
    NEW_PATCH=0
    ;;
  minor)
    NEW_MAJOR=$MAJOR
    NEW_MINOR=$((MINOR + 1))
    NEW_PATCH=0
    ;;
  patch)
    NEW_MAJOR=$MAJOR
    NEW_MINOR=$MINOR
    NEW_PATCH=$((PATCH + 1))
    ;;
  *)
    echo "Invalid bump type: $BUMP_TYPE (use: patch, minor, major)"
    exit 1
    ;;
esac

NEW_VERSION="$NEW_MAJOR.$NEW_MINOR.$NEW_PATCH"
echo "New version: $NEW_VERSION"

# Calculate Android versionCode (major * 10000 + minor * 100 + patch)
VERSION_CODE=$((NEW_MAJOR * 10000 + NEW_MINOR * 100 + NEW_PATCH))
echo "Android versionCode: $VERSION_CODE"

# Update package.json
echo "Updating package.json..."
sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

# Update Android build.gradle
if [ -f "android/app/build.gradle" ]; then
  echo "Updating android/app/build.gradle..."
  sed -i "s/versionCode [0-9]*/versionCode $VERSION_CODE/" android/app/build.gradle
  sed -i "s/versionName \"[0-9.]*\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle
fi

# Update iOS project.pbxproj
if [ -f "ios/App/App.xcodeproj/project.pbxproj" ]; then
  echo "Updating ios/App/App.xcodeproj/project.pbxproj..."
  sed -i "s/MARKETING_VERSION = [0-9.]*;/MARKETING_VERSION = $NEW_VERSION;/g" ios/App/App.xcodeproj/project.pbxproj
  sed -i "s/CURRENT_PROJECT_VERSION = [0-9]*;/CURRENT_PROJECT_VERSION = $VERSION_CODE;/g" ios/App/App.xcodeproj/project.pbxproj
fi

echo "Version bump complete: $CURRENT_VERSION -> $NEW_VERSION"
echo "$NEW_VERSION"
