import * as Location from 'expo-location';

export interface GeocodedLocation {
  address: string;
  city: string;
  country: string;
  district?: string;
  ward?: string;
  subregion?: string;
  region?: string;
  formattedAddress: string;
  detailedAddress: string;
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
      const city = result.city || 'Unknown City';
      const country = result.country || 'Unknown Country';
      const district = result.district || result.subregion;
      const ward = result.subLocality || result.subAdministrativeArea;
      const subregion = result.subregion;
      const region = result.region;
      
      // Tạo địa chỉ chi tiết với quận, phường
      const detailedParts = [];
      if (address && address !== 'Unknown Street') detailedParts.push(address);
      if (ward) detailedParts.push(ward);
      if (district) detailedParts.push(district);
      if (city && city !== 'Unknown City') detailedParts.push(city);
      // if (country && country !== 'Unknown Country') detailedParts.push(country);
      
      const detailedAddress = detailedParts.join(', ');
      
      // Địa chỉ ngắn gọn (chỉ thành phố)
      const formattedAddress = city !== 'Unknown City' ? city : detailedAddress;

      return {
        address,
        city,
        country,
        district,
        ward,
        subregion,
        region,
        formattedAddress,
        detailedAddress,
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
    // Trả về địa chỉ chi tiết với quận, phường
    return geocoded.detailedAddress;
  }
  
  return 'Unknown Location';
};

export const getLocationNameShort = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  const geocoded = await reverseGeocode(latitude, longitude);
  
  if (geocoded) {
    // Trả về địa chỉ ngắn gọn (chỉ thành phố)
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
