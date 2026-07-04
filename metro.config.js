const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const workletsStub = path.resolve(__dirname, 'stubs/react-native-worklets.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-worklets') {
    return { type: 'sourceFile', filePath: workletsStub };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
