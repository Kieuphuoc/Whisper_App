import QuickAction from '@/components/QuickAction';
import VisibilityFilter from '@/components/VisibilityFilter';
import VoiceButton from '@/components/VoiceButton';
import VoicePinCard from '@/components/VoicePinCard';
import VoicePinCluster from '@/components/VoicePinCluster';
import VoicePinPreview from '@/components/VoicePinPreview';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Apis, { authApis, endpoints } from '../../configs/Apis';
import { clusterVoicePins } from '../../utils/clustering';

const { width, height } = Dimensions.get('window');

type VoicePin = {
  id: string;
  latitude: number;
  longitude: number;
  emotion: string;
  description: string;
  duration: number;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  audioUrl: string;
  imageUrl?: string;
  address?: string;
  createdAt: string;
  user?: {
    name: string;
    avatar?: string;
  };
  likes?: number;
  replies?: number;
};


export default function HomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [voicePin, setVoicePin] = useState<VoicePin[]>();
  const [voicePinFriend, setVoicePinFriend] = useState<VoicePin[]>();

  const [voicePinPublic, setVoicePinPublic] = useState<VoicePin[]>();

  const [voicePinClusters, setVoicePinClusters] = useState<any[]>([]);
    const [voicePinClustersFriend, setVoicePinClustersFriend] = useState<any[]>([]);
  const [voicePinClustersPublic, setVoicePinClustersPublic] = useState<any[]>([]);

  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState<string>('');

  const [selectedVoicePin, setSelectedVoicePin] = useState<VoicePin | null>(null);
  const [showVoicePinCard, setShowVoicePinCard] = useState(false);
  const [focusedMarkerId, setFocusedMarkerId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'personal' | 'friends' | 'public'>('public');

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
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const recorderState = useAudioRecorderState(recorder);

  // GET VoicePin
  const loadVoicePin = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const res = await authApis(token).get(endpoints['voice'])
      const data = res.data;
      console.log(data.data)
      setVoicePin(data.data);
      const clusters = clusterVoicePins(data.data || [], 50);
      setVoicePinClusters(clusters);
    } catch (ex: any) {
      console.log('Error loading Memory:', ex);
    } finally {
      setLoading(false);
    }
  };

  // GET VoicePin
  const loadPublicVoicePin = async () => {
    try {
      setLoading(true);
      const res = await Apis.get(endpoints['voicePublic'])
      const data = res.data;
      console.log(data.data)
      setVoicePinPublic(data.data);
      const clusters = clusterVoicePins(data.data || [], 50);
      setVoicePinClustersPublic(clusters);
    } catch (ex: any) {
      console.log('Error loading Memory:', ex);
    } finally {
      setLoading(false);
    }
  };

  // GET Friends VoicePin
  const loadFriendsVoicePin = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const res = await authApis(token).get(endpoints['voiceFriends'])
      const data = res.data;
      console.log(data.data)
      setVoicePinFriend(data.data);
      const clusters = clusterVoicePins(data.data || [], 50);
      setVoicePinClustersFriend(clusters);
    } catch (ex: any) {
      console.log('Error loading Friends Memory:', ex);
    } finally {
      setLoading(false);
    }
  };


  // useEffect(() => {
  //   loadVoicePin();
  //   loadPublicVoicePin();
  // }, []);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }

      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  const record = async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
    setIsRecording(true)
  };

  const stop = async () => {
    await recorder.stop();
    console.log('Record Done!', recorder.uri);
    setIsRecording(false)
    setShowPreview(true)
  };

  // FilterVisibility
  const filterVisibility = useCallback(() => {
    if (activeFilter == 'personal') loadVoicePin();
    else if (activeFilter == 'public') loadPublicVoicePin();
    else if (activeFilter == 'friends') loadFriendsVoicePin();
  }, [activeFilter]);

  const createVoicePin = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const formData = new FormData();
      formData.append('latitude', location?.coords?.latitude?.toString() || '0');
      formData.append('longitude', location?.coords?.longitude?.toString() || '0');
      formData.append('description', description)
      formData.append('visibility', "PUBLIC");
      formData.append('file', {
        uri: recorder.uri || '',
        name: 'audio.m4a',
        type: 'audio/x-m4a',
      } as any);

      const res = await authApis(token).post(endpoints['createVoicePin'], formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload thành công:', res.data);
      // Reset description after successful upload
      setDescription('');
      // Refresh data based on current filter
      filterVisibility();
    } catch (err) {
      console.error('Lỗi upload:', err);
      throw err;
    }
  }, [description, location?.coords?.latitude, location?.coords?.longitude, recorder.uri, setDescription, filterVisibility]);

  const handleMarkerPress = (voicePin: VoicePin) => {
    setSelectedVoicePin(voicePin);
    setFocusedMarkerId(voicePin.id);
    setShowVoicePinCard(true);

    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: voicePin.latitude,
        longitude: voicePin.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 500);
    }
  };

  const handleVoicePinCardClose = () => {
    setShowVoicePinCard(false);
    setSelectedVoicePin(null);
    setFocusedMarkerId(null);
  };

  const handleViewDetail = () => {
    // if (selectedVoicePin) {
    router.push({
      pathname: '/(home)/voiceDetail',
      params: { voicePinId: selectedVoicePin.id }
    });
    // }
  };

  return (


    <View style={styles.container}>
      {location ? (
        <MapView
          ref={mapRef}
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
            title="Your Location"
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationDot} />
              <View style={styles.currentLocationRing} />
              <View style={styles.currentLocationGlow} />
            </View>
          </Marker>

          {voicePinClusters.map((cluster, index) => (
            <Marker
              key={`cluster-${index}`}
              coordinate={{
                latitude: cluster.latitude,
                longitude: cluster.longitude,
              }}
            >
              <VoicePinCluster
                voicePins={cluster.voicePins}
                latitude={cluster.latitude}
                longitude={cluster.longitude}
                onPress={handleMarkerPress}
              />
            </Marker>
          ))}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Getting your location...</Text>
        </View>
      )}

      <QuickAction />
      {/* <FilterToggle /> */}
      {/* <StatsBento voicesCount={3} radius='100'  /> */}

      <VisibilityFilter activeFilter={activeFilter} setActiveFilter={setActiveFilter} onPress={filterVisibility} />


      <Modal
        visible={showVoicePinCard}
        transparent
        animationType="slide"
        onRequestClose={handleVoicePinCardClose}
      >
        <View style={styles.voicePinCardModal}>
          <View style={styles.voicePinCardOverlay} />
          {selectedVoicePin && (
            <VoicePinCard
              voicePin={selectedVoicePin}
              onPress={handleViewDetail}
              onClose={handleVoicePinCardClose}
            />
          )}
        </View>
      </Modal>

      <Modal
        visible={showPreview}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPreview(false);
          setDescription(''); // Reset description when closing modal
        }}
      >
        <View style={styles.previewModal}>
          <VoicePinPreview
            recorder={recorder}
            createVoicePin={createVoicePin}
            description={description}
            setDescription={setDescription}
            onClose={() => {
              setShowPreview(false);
              setDescription(''); // Reset description when closing modal
            }}
          />
        </View>
      </Modal>

      <Animated.View style={[
        styles.voiceButtonContainer,
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <VoiceButton isRecording={isRecording} onPress={isRecording ? stop : record} />
      </Animated.View>

      <TouchableOpacity style={styles.randomVoiceButton} onPress={handleViewDetail}>
        <Ionicons name="shuffle" size={24} color="white" />
      </TouchableOpacity>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e8f5e8', // Light green background like Mercedes app
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
  },
  loadingText: {
    fontSize: 16,
    color: '#374151',
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
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
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
    color: '#94a3b8',
  },
  activeFilterText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  userProfileCard: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1,
  },
  userProfileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  pointsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  userProfileInfo: {
    flex: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userCardNumber: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 2,
  },
  userMemberSince: {
    color: '#9ca3af',
    fontSize: 12,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardType: {
    alignSelf: 'flex-end',
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cardTypeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  newsCard: {
    position: 'absolute',
    top: 320,
    left: 16,
    right: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1,
  },
  newsHeader: {
    marginBottom: 12,
  },
  newsTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  newsTagText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  newsContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  newsText: {
    flex: 1,
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
    marginRight: 12,
  },
  newsImage: {
    width: 80,
    height: 60,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newsIconText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
  },
  electromobilityButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  electromobilityText: {
    color: '#374151',
    fontSize: 10,
    fontWeight: '600',
  },
  serviceCardsContainer: {
    position: 'absolute',
    top: 480,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  serviceCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  serviceCardText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  serviceTitle: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  serviceDate: {
    color: '#374151',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDescription: {
    color: '#6b7280',
    fontSize: 12,
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    backgroundColor: '#1f2937',
    borderRadius: 20,
    flexDirection: 'row',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 1,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
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
  voicePinCardModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  voicePinCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
});
