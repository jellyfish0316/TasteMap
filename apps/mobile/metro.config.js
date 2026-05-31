// Metro config for an Expo app inside an npm-workspaces monorepo.
// Two jobs: (1) watch the repo root so changes in packages/* hot-reload,
// (2) resolve modules from both the app and the hoisted root node_modules.
// Then wrap with NativeWind so Tailwind classes work in React Native.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });
