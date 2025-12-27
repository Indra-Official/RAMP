const { withAndroidManifest, withAppBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

const withWifiP2P = (config) => {
  // 1. Add Permissions to AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const permissions = [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.CHANGE_WIFI_STATE",
      "android.permission.ACCESS_WIFI_STATE",
      "android.permission.INTERNET",
      "android.permission.NEARBY_WIFI_DEVICES" // For Android 13+
    ];

    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    permissions.forEach(permission => {
      // Avoid duplicates
      if (!androidManifest.manifest['uses-permission'].some(p => p.$['android:name'] === permission)) {
        androidManifest.manifest['uses-permission'].push({ $: { 'android:name': permission } });
      }
    });

    return config;
  });

  // 2. Add Implementation to app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("react-native-wifi-p2p")) {
      config.modResults.contents += `\n dependencies { implementation project(':react-native-wifi-p2p') } \n`;
    }
    return config;
  });

  return config;
};

module.exports = createRunOncePlugin(withWifiP2P, 'react-native-wifi-p2p-plugin', '1.0.0');
