const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Fix socket.io-client v4 ESM resolution issues for Metro
config.resolver.sourceExts = [...config.resolver.sourceExts, "mjs", "cjs"];
config.resolver.assetExts = [...config.resolver.assetExts, "glb"];

// Explicitly map socket.io-client to its pre-built bundle
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'socket.io-client': require.resolve('socket.io-client/dist/socket.io.js'),
  'fs/promises': require.resolve('./empty-module.js'),
  'path': require.resolve('./empty-module.js'),
  'crypto': require.resolve('./empty-module.js'),
  'url': require.resolve('./empty-module.js'),
  'stream': require.resolve('./empty-module.js'),
  'os': require.resolve('./empty-module.js'),
};

module.exports = withNativeWind(config, { input: "./global.css" });



