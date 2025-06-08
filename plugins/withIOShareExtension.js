const { withXcodeProject, withInfoPlist } = require("@expo/config-plugins");
const path = require("path");

function withIOSShareExtension(config) {
  // Add URL scheme handling
  config = withInfoPlist(config, (config) => {
    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    config.modResults.CFBundleURLTypes.push({
      CFBundleURLName: "pocket-share",
      CFBundleURLSchemes: ["pocket-share"],
    });

    return config;
  });

  return config;
}

module.exports = withIOSShareExtension;
