import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

type VoiceMarkerProps = {
  latitude: number;
  longitude: number;
  title: string;
};

export default function VoiceMarker({ latitude, longitude, title }: VoiceMarkerProps) {

  return (
    <Marker
      coordinate={{
        latitude: latitude,
        longitude: longitude,
      }}  
      title={title}
    >
      <View style={styles.markerContainer}>
        <View style={styles.markerBackground}>
          <Text style={styles.markerEmoji}>😃</Text>
        </View>
        <View style={styles.markerPulse} />
        <View style={styles.markerGlow} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  markerBackground: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#8b5cf6',
  },
  markerEmoji: {
    fontSize: 20,
  },
  markerPulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  markerGlow: {
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
})