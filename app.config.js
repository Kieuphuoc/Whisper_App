import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    plugins: config.plugins,
    extra: {
      ...(config.extra || {}),
      googleWebClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
      googleIosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
      googleAndroidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
    },
  };
};
