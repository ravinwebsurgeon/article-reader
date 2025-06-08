const { withAndroidManifest } = require("@expo/config-plugins");

function withShareIntent(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Find the main activity
    const mainActivity = androidManifest.manifest.application[0].activity.find(
      (activity) => activity.$["android:name"] === ".MainActivity",
    );

    if (mainActivity) {
      // Add intent filter for sharing
      if (!mainActivity["intent-filter"]) {
        mainActivity["intent-filter"] = [];
      }

      // Add share intent filter
      mainActivity["intent-filter"].push({
        action: [{ $: { "android:name": "android.intent.action.SEND" } }],
        category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
        data: [{ $: { "android:mimeType": "text/plain" } }],
      });
    }

    return config;
  });
}

module.exports = withShareIntent;
