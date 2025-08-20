import VoiceButton from '@/components/ui/VoiceButton';
import { Audio } from 'expo-av';
import * as Sharing from 'expo-sharing';

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
  },);

  // Record
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);


  const shareRecording = async (uri: string) => {
    if (!(await Sharing.isAvailableAsync())) {
      alert('Chia sẻ không khả dụng trên thiết bị này');
      return;
    }
    await Sharing.shareAsync(uri);
  };

  // Bắt đầu ghi âm
  const startRecording = async () => {
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Dừng ghi âm
  const stopRecording = async () => {
    if (!recording) return;
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log('File ghi âm:', uri);
    Alert.alert('Ghi âm xong', `Đường dẫn file: ${uri}`);
    setRecording(null);
    setIsRecording(false);
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
      <VoiceButton isRecording={isRecording} onPress={isRecording ? stopRecording : startRecording} />
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
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  voiceButton: {
    position: 'absolute',
    bottom: 70,
    left: '50%',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF4E4E',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateX: -30 }, { translateY: -30 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
