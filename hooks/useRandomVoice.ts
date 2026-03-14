import { VoicePin } from '@/types';
import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

function getDistanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useRandomVoice(allVoices: VoicePin[]) {
  const [currentVoice, setCurrentVoice] = useState<VoicePin | null>(null);
  const [loading, setLoading] = useState(false);

  const playRandomVoice = useCallback(async () => {
    setLoading(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      let location: Location.LocationObject | null = null;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (e) {
        console.warn('Could not get current location, trying last known position', e);
        location = await Location.getLastKnownPositionAsync({});
      }

      if (!location) {
        console.error('Could not obtain any location');
        setLoading(false);
        return;
      }

      const { latitude, longitude } = location.coords;

      if (!allVoices || !Array.isArray(allVoices)) {
        setCurrentVoice(null);
        setLoading(false);
        return;
      }

      const validVoices = allVoices.filter((voice) => {
        if (voice.visibility !== 'PUBLIC') return false;

        const distance = getDistanceInMeters(
          latitude,
          longitude,
          voice.latitude,
          voice.longitude
        );

        if (voice.unlockRadius > 0) {
          return distance <= voice.unlockRadius;
        }

        return distance <= 1000;
      });

      if (validVoices.length === 0) {
        setCurrentVoice(null);
        setLoading(false);
        return;
      }

      const randomIndex = Math.floor(Math.random() * validVoices.length);
      setCurrentVoice(validVoices[randomIndex]);
    } catch (error) {
      console.error('Error in playRandomVoice:', error);
    } finally {
      setLoading(false);
    }
  }, [allVoices]);

  return {
    currentVoice,
    loading,
    playRandomVoice,
  };
}
