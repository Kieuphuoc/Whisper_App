const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Allow bundling GLB 3D assets
config.resolver.assetExts = [...config.resolver.assetExts, "glb"];

module.exports = withNativeWind(config, { input: "./global.css" });
