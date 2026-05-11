import { useLocationContext } from "@/contexts/LocationContext";

export function useLocation() {
  const { location } = useLocationContext();
  return { location };
}
