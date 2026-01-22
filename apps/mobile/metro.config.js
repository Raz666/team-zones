const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow bundling of CSS assets used by the local WebView HTML.
config.resolver.assetExts.push('css');

module.exports = config;
