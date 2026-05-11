import * as Location from "expo-location";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type PermissionStatus = "granted" | "denied" | "undetermined";

type LocationContextType = {
  location: Location.LocationObject | null;
  permissionStatus: PermissionStatus;
  isReady: boolean;
};

const LocationContext = createContext<LocationContextType>({
  location: null,
  permissionStatus: "undetermined",
  isReady: false,
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("undetermined");
  const [isReady, setIsReady] = useState(false);

  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      const granted = status === "granted";
      setPermissionStatus(granted ? "granted" : "denied");

      if (!granted) {
        setIsReady(true);
        return;
      }

      // Hiển thị vị trí cuối cùng ngay lập tức (không block UI)
      try {
        const last = await Location.getLastKnownPositionAsync({});
        if (!cancelled && last) setLocation(last);
      } catch {
        // không sao nếu không có vị trí cũ
      }

      // Bắt đầu 1 watcher duy nhất cho toàn app ở độ chính xác cân bằng
      watchRef.current?.remove();
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 20,
        },
        (loc) => {
          if (!cancelled) setLocation(loc);
        }
      );

      if (!cancelled) setIsReady(true);
    };

    init();

    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, []);

  return (
    <LocationContext.Provider value={{ location, permissionStatus, isReady }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  return useContext(LocationContext);
}
