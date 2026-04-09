import Mapbox from "@rnmapbox/maps";

export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "";

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

export default Mapbox;
