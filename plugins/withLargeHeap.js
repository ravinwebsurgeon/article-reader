const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withLargeHeap(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application[0]["$"];
    app["android:largeHeap"] = "true";
    return cfg;
  });
};
