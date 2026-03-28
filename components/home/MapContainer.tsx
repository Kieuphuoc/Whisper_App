import { VoicePin, VoiceType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useState, useCallback, forwardRef } from "react";
import { StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import { Text } from "@/components/ui/text";
import MapView, { Callout, Marker, Region, MapType } from "react-native-maps";
import MapViewClustering from "react-native-map-clustering";
import VoicePinCard from "./VoicePinCard";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';
import ClusterMarker from "./ClusterMarker";
import { BASE_URL } from "@/configs/Apis";
import { Image } from "react-native";

import RadarOverlay from "../discovery/RadarOverlay";
import SpawnedVoicePin from "../discovery/SpawnedVoicePin";
import { darkMapStyle } from "@/constants/MapStyles";


const DEFAULT_DELTA = 0.01;
const FALLBACK_LAT = 10.7769;
const FALLBACK_LNG = 106.7009;

type Props = {
  location: Location.LocationObject | null;
  pins: VoicePin[];
  isScanning?: boolean;
  discoveredPin?: VoicePin | null;
  onPressDiscoveredPin?: () => void;
  externalSelectedPin?: VoicePin | null;
  onSelectPin?: (pin: VoicePin | null) => void;
  autoPlayPin?: boolean;
  onRegionChangeComplete?: (region: Region) => void;
};

const MapSection = forwardRef<MapView, Props>(({
  location,
  pins,
  isScanning = false,
  discoveredPin,
  onPressDiscoveredPin,
  externalSelectedPin,
  onSelectPin,
  autoPlayPin = false,
  onRegionChangeComplete,
}, ref) => {
  const [internalSelectedPin, setInternalSelectedPin] = useState<VoicePin | null>(null);

  const selectedPin = externalSelectedPin !== undefined ? externalSelectedPin : internalSelectedPin;
  const setSelectedPin = (pin: VoicePin | null) => {
    if (onSelectPin) {
      onSelectPin(pin);
    } else {
      setInternalSelectedPin(pin);
    }
  };
  const [mapType, setMapType] = useState<string>('dark');
  useColorScheme();

  const loadMapType = useCallback(async () => {
    try {
      const savedMapType = await AsyncStorage.getItem('mapType');
      if (savedMapType) {
        if (savedMapType === 'standard') setMapType('dark');
        else if (savedMapType === 'terrain') setMapType('light');
        else setMapType(savedMapType);
      }
    } catch (e) {
      console.error("Failed to load map type", e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMapType();
    }, [loadMapType])
  );

  const initialRegion: Region = {
    latitude: location?.coords.latitude ?? FALLBACK_LAT,
    longitude: location?.coords.longitude ?? FALLBACK_LNG,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  };

  if (!location) {
    return (
      <View style={styles.center}>
        <Ionicons name="location-outline" size={30} color="#8b5cf6" />
        <Text style={styles.centerText}>Đang lấy vị trí...</Text>
      </View>
    );
  }

  return (
    <View style={styles.map}>
      {/* MapViewClustering is a drop-in replacement for MapView that adds cluster support */}
      <MapViewClustering
        key={mapType}
        ref={ref}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        mapType={(mapType === 'satellite' ? 'satellite' : 'standard') as MapType}
        customMapStyle={mapType === 'dark' ? darkMapStyle : []}
        userInterfaceStyle={mapType === 'dark' ? 'dark' : 'light'}
        onRegionChangeComplete={onRegionChangeComplete}
        // Clustering config
        radius={60}           // pixel radius of each cluster
        minPoints={3}         // min pins before forming a cluster
        extent={512}
        nodeSize={64}
        // Custom cluster marker renderer
        renderCluster={(cluster) => {
          const { id, geometry, onPress, properties } = cluster;
          const count: number = properties.point_count;
          const coord = {
            latitude: geometry.coordinates[1],
            longitude: geometry.coordinates[0],
          };
          // Size grows with count
          const size = count < 5 ? 44 : count < 15 ? 52 : 62;
          const bg = count < 5 ? '#ef4444' : count < 15 ? '#f97316' : '#8b5cf6';
          return <ClusterMarker id={id} coordinate={coord} count={count} size={size} bg={bg} onPress={onPress} />;
        }}
      >
        {pins.map((pin) => {
          const isAR = pin.type === VoiceType.HIDDEN_AR;

          const avatarUri = (() => {
            const userAvatar = pin.user?.avatar;
            if (!userAvatar) return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
            if (userAvatar.startsWith('http')) return userAvatar;
            return `${BASE_URL}${userAvatar.startsWith('/') ? '' : '/'}${userAvatar}`;
          })();

          return (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
              onPress={() => setSelectedPin(pin)}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
            >
              {/* Custom pin marker */}
              <View style={styles.markerWrap}>
                <View style={[styles.markerBubble, isAR && styles.markerBubbleAR]}>
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.markerAvatar}
                  />
                  {/* Small icon overlay to indicate type */}
                  <View style={[styles.typeIndicator, { backgroundColor: isAR ? "#8b5cf6" : "#ef4444" }]}>
                    <Ionicons
                      name={isAR ? "sparkles" : "mic"}
                      size={8}
                      color="#fff"
                    />
                  </View>
                </View>
                <View style={[styles.markerTail, isAR && styles.markerTailAR]} />
              </View>

              {/* Callout card */}
              <Callout tooltip onPress={() => setSelectedPin(pin)}>
                <View style={styles.callout}>
                  <View style={styles.calloutHeader}>
                    <Ionicons
                      name={isAR ? "sparkles-outline" : "mic-outline"}
                      size={13}
                      color={isAR ? "#8b5cf6" : "#ef4444"}
                    />
                    <Text style={styles.calloutTitle} numberOfLines={1}>
                      {isAR ? "Giọng nói AR ẩn" : pin.content ?? "Ghim giọng nói"}
                    </Text>
                  </View>
                  {!!pin.address && (
                    <View style={styles.calloutMeta}>
                      <Ionicons name="location-outline" size={11} color="#9ca3af" />
                      <Text style={styles.calloutMetaTxt} numberOfLines={1}>{pin.address}</Text>
                    </View>
                  )}
                  <View style={styles.calloutStats}>
                    <Ionicons name="headset-outline" size={11} color="#9ca3af" />
                    <Text style={styles.calloutStatText}>{pin.listensCount ?? 0}</Text>
                    <Ionicons name="heart-outline" size={11} color="#f87171" style={{ marginLeft: 6 }} />
                    <Text style={styles.calloutStatText}>{pin.reactionsCount ?? 0}</Text>
                  </View>
                  <TouchableOpacity style={styles.calloutBtn} onPress={() => setSelectedPin(pin)}>
                    <Text style={styles.calloutBtnText}>Xem chi tiết</Text>
                    <Ionicons name="chevron-forward" size={12} color="#8b5cf6" />
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          );
        })}

        {discoveredPin && (
          <SpawnedVoicePin
            pin={discoveredPin}
            onPress={() => onPressDiscoveredPin?.()}
          />
        )}
      </MapViewClustering>


      <RadarOverlay isScanning={isScanning} />

      {/* Full-screen overlay when pin selected */}
      {selectedPin && (
        <VoicePinCard
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          autoPlay={autoPlayPin && selectedPin.id === discoveredPin?.id}
        />
      )}
    </View>
  );
});

MapSection.displayName = "MapSection";

export default MapSection;

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: {
    flex: 1, justifyContent: "center", alignItems: "center", gap: 10, backgroundColor: "#f3f4f6",
  },
  centerText: { color: "#6b7280", fontSize: 15 },

  // ── Cluster ─────────────────────────────
  cluster: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  clusterInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  clusterCount: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },

  // ── Marker ───────────────────────────────
  markerWrap: { alignItems: "center" },
  markerBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    overflow: 'visible',
  },
  markerAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  typeIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerBubbleAR: { borderColor: "#8b5cf6" },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
    marginTop: -1,
  },
  markerTailAR: { borderTopColor: "#8b5cf6" },

  // ── Callout ──────────────────────────────
  callout: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    width: 210,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    gap: 4,
  },
  calloutHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  calloutTitle: { fontWeight: "700", fontSize: 13, color: "#111827", flex: 1 },
  calloutMeta: { flexDirection: "row", alignItems: "center", gap: 3 },
  calloutMetaTxt: { fontSize: 11, color: "#9ca3af", flex: 1 },
  calloutStats: { flexDirection: "row", alignItems: "center" },
  calloutStatText: { color: "#9ca3af", fontSize: 11, marginLeft: 3 },
  calloutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    marginTop: 4, gap: 2,
  },
  calloutBtnText: { color: "#8b5cf6", fontSize: 12, fontWeight: "600" },
});
