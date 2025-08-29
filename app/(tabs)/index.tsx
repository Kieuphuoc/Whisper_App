import VoiceButton from '@/components/VoiceButton';
import { Ionicons } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, useAudioRecorder } from 'expo-audio';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

type VoicePin = {
  id: string;
  latitude: number;
  longitude: number;
  emotion: string;
  title: string;
  duration: string;
  isPublic: boolean;
  isFriend: boolean;
  isPersonal: boolean;
  address?: string;
};

type FilterType = 'public' | 'friends' | 'personal';

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('personal');
  const [voicePins, setVoicePins] = useState<VoicePin[]>([
    {
      id: '1',
      latitude: 37.78825,
      longitude: -122.4324,
      emotion: '😊',
      title: 'Morning coffee vibes',
      duration: '0:45',
      isPublic: true,
      isFriend: false,
      isPersonal: false,
      address: 'Central Park, New York',
    },
    {
      id: '2',
      latitude: 37.78925,
      longitude: -122.4344,
      emotion: '🎵',
      title: 'Street music inspiration',
      duration: '1:20',
      isPublic: false,
      isFriend: true,
      isPersonal: false,
      address: 'Coffee Shop, San Francisco',
    },
    {
      id: '3',
      latitude: 37.78725,
      longitude: -122.4304,
      emotion: '🌅',
      title: 'Sunrise meditation',
      duration: '2:15',
      isPublic: false,
      isFriend: false,
      isPersonal: true,
      address: 'Golden Gate Bridge',
    },
  ]);

  const [pulseAnim] = useState(new Animated.Value(1));
  const [scaleAnim] = useState(new Animated.Value(1));


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


  

 
  const getFilteredPins = () => {
    return voicePins.filter(pin => {
      switch (activeFilter) {
        case 'public':
          return pin.isPublic;
        case 'friends':
          return pin.isFriend;
        case 'personal':
          return pin.isPersonal;
        default:
          return true;
      }
    });
  };

  const FilterToggle = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterBento}>
        {(['personal', 'friends', 'public'] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              activeFilter === filter && styles.activeFilterButton
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              activeFilter === filter && styles.activeFilterText
            ]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const VoicePinMarker = ({ pin }: { pin: VoicePin }) => (
    <Marker
      coordinate={{
        latitude: pin.latitude,
        longitude: pin.longitude,
      }}
      title={pin.title}
    >
      <View style={styles.markerContainer}>
        <View style={styles.markerBackground}>
          <Text style={styles.markerEmoji}>{pin.emotion}</Text>
        </View>
        <View style={styles.markerPulse} />
        <View style={styles.markerGlow} />
      </View>
    </Marker>
  );

  const QuickActions = () => (
    <View style={styles.quickActionsBento}>
      <TouchableOpacity style={styles.quickActionButton}>
        <View style={styles.quickActionIcon}>
          <Ionicons name="compass" size={20} color="#8b5cf6" />
        </View>
        <Text style={styles.quickActionText}>Explore</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickActionButton}>
        <View style={styles.quickActionIcon}>
          <Ionicons name="people" size={20} color="#8b5cf6" />
        </View>
        <Text style={styles.quickActionText}>Friends</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickActionButton}>
        <View style={styles.quickActionIcon}>
          <Ionicons name="trending-up" size={20} color="#8b5cf6" />
        </View>
        <Text style={styles.quickActionText}>Trending</Text>
      </TouchableOpacity>
    </View>
  );

  const StatsBento = () => (
    <View style={styles.statsBento}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{voicePins.length}</Text>
        <Text style={styles.statLabel}>Voices</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>1.2km</Text>
        <Text style={styles.statLabel}>Radius</Text>
      </View>
    </View>
  );

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
          {/* Current location marker */}
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
            title="Your Location"
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
              <View style={styles.currentLocationRing} />
              <View style={styles.currentLocationGlow} />
            </View>
          </Marker>

          {/* Voice pins */}
          {getFilteredPins().map((pin) => (
            <VoicePinMarker key={pin.id} pin={pin} />
          ))}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}

      {/* Filter toggle */}
      <FilterToggle />

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Bento */}
      <StatsBento />

      {/* Voice recording button */}
      <Animated.View style={[
        styles.voiceButtonContainer,
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <VoiceButton isRecording={isRecording} onPress={isRecording ? stop : record} />
      </Animated.View>

      {/* Random voice button */}
      <TouchableOpacity style={styles.randomVoiceButton}>
        <Ionicons name="shuffle" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1,
  },
  filterBento: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterText: {
    color: '#ffffff',
    fontWeight: '600',
  },
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
  currentLocationMarker: {
    alignItems: 'center',
  },
  currentLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8b5cf6',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  currentLocationRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  currentLocationGlow: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  voiceButtonContainer: {
    position: 'absolute',
    bottom: 110,
    right: 170,
    width: 64,
    height: 64,
  },
  randomVoiceButton: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  quickActionsBento: {
    position: 'absolute',
    top: 140,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  quickActionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  statsBento: {
    position: 'absolute',
    top: 140,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    marginVertical: 8,
  },
});
