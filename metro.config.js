const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

const tslibShim = path.resolve(__dirname, "tslib-interop.js");
const tslibDir = path.resolve(__dirname, "node_modules/tslib");

// Fix: tslib sets __esModule:true but has no .default, so ESM default imports
// from packages like framer-motion fail. Redirect all tslib requires to our shim.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isTslib =
    moduleName === "tslib" ||
    (moduleName.endsWith("tslib.js") &&
      context.originModulePath.startsWith(tslibDir));
  if (isTslib) {
    return { filePath: tslibShim, type: "sourceFile" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
