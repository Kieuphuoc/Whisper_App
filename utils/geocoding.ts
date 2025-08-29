import * as Location from 'expo-location';

export interface GeocodedLocation {
  address: string;
  city: string;
  country: string;
  formattedAddress: string;
}

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<GeocodedLocation | null> => {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (results.length > 0) {
      const result = results[0];
      
      const address = result.street || result.name || 'Unknown Street';
      const city = result.city || result.subregion || 'Unknown City';
      const country = result.country || 'Unknown Country';
      
      const formattedAddress = [
        address,
        city,
        country
      ].filter(Boolean).join(', ');

      return {
        address,
        city,
        country,
        formattedAddress,
      };
    }

    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

export const getLocationName = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  const geocoded = await reverseGeocode(latitude, longitude);
  
  if (geocoded) {
    // Return a shorter, more user-friendly format
    if (geocoded.city && geocoded.city !== 'Unknown City') {
      return geocoded.city;
    }
    return geocoded.formattedAddress;
  }
  
  return 'Unknown Location';
};

export const formatLocationForDisplay = (
  latitude: number,
  longitude: number,
  customName?: string
): string => {
  if (customName) {
    return customName;
  }
  
  // Fallback to coordinates if no custom name
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
};
