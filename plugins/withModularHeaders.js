const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * A local Expo config plugin to add `use_modular_headers!` to the Podfile.
 * This is required when using `useFrameworks: "static"` with Firebase and other Swift pods.
 */
function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.projectRoot, 'ios', 'Podfile');
      
      // Check if Podfile exists (it should during prebuild)
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, 'utf-8');
        
        if (!podfileContent.includes('use_modular_headers!')) {
          console.log('[withModularHeaders] Adding use_modular_headers! to Podfile');
          // Add it right before use_expo_modules! or at a safe place
          podfileContent = podfileContent.replace(
            /use_expo_modules!/,
            'use_modular_headers!\n  use_expo_modules!'
          );
          fs.writeFileSync(podfilePath, podfileContent);
        }
      }
      
      return config;
    },
  ]);
}

module.exports = withModularHeaders;
