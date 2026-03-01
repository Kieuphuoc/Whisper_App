import * as Location from "expo-location";
import { useEffect, useState } from "react";

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  return { location };
}
