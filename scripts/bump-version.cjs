#!/usr/bin/env node
/**
 * Version bump script for SpicyVSSweet
 * Updates version in: package.json, android/app/build.gradle, ios project.pbxproj
 *
 * Usage: node scripts/bump-version.js [patch|minor|major]
 */

const fs = require('fs');
const path = require('path');

const BUMP_TYPE = process.argv[2] || 'patch';

// File paths
const PACKAGE_JSON = path.join(__dirname, '..', 'package.json');
const ANDROID_GRADLE = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
const IOS_PBXPROJ = path.join(__dirname, '..', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

// Read current version
const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
const currentVersion = packageJson.version;
console.log(`Current version: ${currentVersion}`);

// Parse and bump version
const [major, minor, patch] = currentVersion.split('.').map(Number);
let newMajor = major, newMinor = minor, newPatch = patch;

switch (BUMP_TYPE) {
  case 'major':
    newMajor++;
    newMinor = 0;
    newPatch = 0;
    break;
  case 'minor':
    newMinor++;
    newPatch = 0;
    break;
  case 'patch':
    newPatch++;
    break;
  default:
    console.error(`Invalid bump type: ${BUMP_TYPE} (use: patch, minor, major)`);
    process.exit(1);
}

const newVersion = `${newMajor}.${newMinor}.${newPatch}`;
const versionCode = newMajor * 10000 + newMinor * 100 + newPatch;

console.log(`New version: ${newVersion}`);
console.log(`Version code: ${versionCode}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + '\n');
console.log('Updated package.json');

// Update Android build.gradle
if (fs.existsSync(ANDROID_GRADLE)) {
  let gradleContent = fs.readFileSync(ANDROID_GRADLE, 'utf8');
  gradleContent = gradleContent.replace(/versionCode \d+/, `versionCode ${versionCode}`);
  gradleContent = gradleContent.replace(/versionName "[^"]*"/, `versionName "${newVersion}"`);
  fs.writeFileSync(ANDROID_GRADLE, gradleContent);
  console.log('Updated android/app/build.gradle');
}

// Update iOS project.pbxproj
if (fs.existsSync(IOS_PBXPROJ)) {
  let pbxContent = fs.readFileSync(IOS_PBXPROJ, 'utf8');
  pbxContent = pbxContent.replace(/MARKETING_VERSION = [\d.]+;/g, `MARKETING_VERSION = ${newVersion};`);
  pbxContent = pbxContent.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${versionCode};`);
  fs.writeFileSync(IOS_PBXPROJ, pbxContent);
  console.log('Updated ios/App/App.xcodeproj/project.pbxproj');
}

console.log(`\nVersion bump complete: ${currentVersion} -> ${newVersion}`);

// Output just the version for scripts to capture
console.log(`\n::set-output name=version::${newVersion}`);
console.log(`::set-output name=version_code::${versionCode}`);
