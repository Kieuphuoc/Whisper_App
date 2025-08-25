import VoiceButton from '@/components/VoiceButton';
import { AudioModule, RecordingPresets, useAudioRecorder } from 'expo-audio';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import MapView, { Marker } from 'react-native-maps';

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    async function getCurrentLocation() {

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  // RECORD

  useEffect(() => {
    async function getMicPermission() { // Create async function to request permission, then await to receive the reply
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission to use micro was denied");
      }
    }
    getMicPermission() // Then use this function in here
  }, []);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  const record = async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
    console.log('Is Recording', recorder.uri);
    setIsRecording(true)
  };

  const stop = async () => {
    await recorder.stop();
    console.log('Record Done!', recorder.uri);
    setIsRecording(true)

  };


  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          mapType='standard'
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Vị trí của bạn"
          />
        </MapView>

      ) : (
        <Text>Đang lấy vị trí...</Text>
      )}
      {/* Nút voice nổi trên map */}
      <VoiceButton isRecording={isRecording} onPress={isRecording ? stop : record} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
