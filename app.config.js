import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    plugins: config.plugins?.map(plugin => {
      if (Array.isArray(plugin) && plugin[0] === '@rnmapbox/maps') {
        return [
          plugin[0],
          {
            ...plugin[1],
            RNMapboxMapsDownloadToken: process.env.MAPBOX_SECRET_TOKEN,
          }
        ];
      }
      return plugin;
    })
  };
};
