#!/usr/bin/env node

/**
 * Version update script for the PromptLab project
 * 
 * This script updates the version in all package.json files
 * according to semantic versioning rules. It supports:
 * - Standard version bumps (major, minor, patch)
 * - Prerelease versions with identifiers (alpha, beta, rc, etc.)
 * - Custom version specification
 */

import fs from 'fs';
import { execSync } from 'child_process';
import semver from 'semver';

// Get params from args
const versionType = process.argv[2];
const prereleaseId = process.argv[3] || 'alpha';
const customId = process.argv[4] || '';
const customVersion = process.argv[5] || '';

// Define valid version types
const validVersionTypes = [
  'major', 'minor', 'patch', 
  'premajor', 'preminor', 'prepatch', 'prerelease',
  'custom'
];

// Separate regular and prerelease version types
const regularVersionTypes = ['major', 'minor', 'patch'];
const prereleaseVersionTypes = ['premajor', 'preminor', 'prepatch', 'prerelease'];

if (!validVersionTypes.includes(versionType)) {
  console.error(`Invalid version type. Use one of: ${validVersionTypes.join(', ')}`);
  process.exit(1);
}

// Validate inputs based on version type
if (regularVersionTypes.includes(versionType) && 
    (prereleaseId !== 'alpha' || customId.trim() !== '')) {
  console.log('Note: Prerelease identifiers are ignored for regular version types (major, minor, patch)');
}

// Find all package.json files
const packagePaths = [
  './package.json',
  './frontend/package.json',
  './backend/package.json',
];

// Read root package.json first to get current version
const rootPackage = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const currentVersion = rootPackage.version;

let newVersion;

if (versionType === 'custom') {
  // Use custom version directly
  if (!customVersion || !semver.valid(customVersion)) {
    console.error('Invalid custom version. Must be a valid semver version.');
    process.exit(1);
  }
  newVersion = customVersion;
} else if (prereleaseVersionTypes.includes(versionType)) {
  // Handle prerelease identifiers for prerelease version types only
  const identifier = prereleaseId === 'custom' ? customId : prereleaseId;
  
  if (prereleaseId === 'custom' && (!customId || customId.trim() === '')) {
    console.error('Custom prerelease identifier is required when custom is selected.');
    process.exit(1);
  }
  
  newVersion = semver.inc(currentVersion, versionType, identifier);
} else {
  // Standard version increment - ignore any prerelease identifiers
  newVersion = semver.inc(currentVersion, versionType);
}

if (!newVersion) {
  console.error('Failed to determine new version');
  process.exit(1);
}

// Output version change
console.log(`Version change: ${currentVersion} → ${newVersion}`);

// Update all package.json files
packagePaths.forEach(path => {
  try {
    const packageFile = JSON.parse(fs.readFileSync(path, 'utf8'));
    packageFile.version = newVersion;
    fs.writeFileSync(path, JSON.stringify(packageFile, null, 2) + '\n');
    console.log(`Updated ${path} to version ${newVersion}`);
  } catch (error) {
    console.error(`Error updating ${path}: ${error.message}`);
    process.exit(1);
  }
});

// Output new version for GitHub Actions
console.log(`echo "new_version=${newVersion}" >> $GITHUB_OUTPUT`);