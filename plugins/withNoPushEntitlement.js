const { withEntitlementsPlist } = require('@expo/config-plugins');

/**
 * Removes aps-environment so the app can be signed with a free/personal Apple team.
 * Local notifications still work; remote push (APNs) requires a paid developer account.
 * Must be listed after "expo-notifications" in app.json plugins.
 */
function withNoPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
}

module.exports = withNoPushEntitlement;
