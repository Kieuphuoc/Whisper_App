import * as Location from "expo-location";
import { useEffect, useState } from "react";

export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        // Try to get high accuracy position first
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(loc);
      } catch (error) {
        console.warn("Error getting current position:", error);
        // Fallback to last known position if current fails
        try {
          const lastLoc = await Location.getLastKnownPositionAsync({});
          if (lastLoc) {
            setLocation(lastLoc);
          }
        } catch (fallbackError) {
          console.error("Failed to get even last known position:", fallbackError);
        }
      }
    })();
  }, []);

  return { location };
}
