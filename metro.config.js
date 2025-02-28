// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add this to fix the $ReadOnlyArray issue
config.resolver.sourceExts = process.env.RN_SOURCE_EXTENSION
  ? [...process.env.RN_SOURCE_EXTENSION.split(','), ...config.resolver.sourceExts]
  : config.resolver.sourceExts;

module.exports = config; 