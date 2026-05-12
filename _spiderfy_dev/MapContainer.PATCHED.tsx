/**
 * PATCHED VERSION of components/home/MapContainer.tsx với Spiderfy tích hợp.
 *
 * Để triển khai:
 *   1. Copy useSpiderfy.ts  →  App/hooks/useSpiderfy.ts
 *   2. Copy SpiderfyMarker.tsx  →  App/components/home/SpiderfyMarker.tsx
 *      (sửa lại đường dẫn require image: '../../assets/images/marker_hidden_voice.png')
 *   3. Copy SpiderfyLegs.tsx  →  App/components/home/SpiderfyLegs.tsx
 *   4. Thay toàn bộ App/components/home/MapContainer.tsx bằng file này
 *
 * VẤN ĐỀ CẦN GIẢI QUYẾT TRƯỚC KHI DEPLOY:
 *   - react-native-maps không hỗ trợ opt-out clustering cho từng Marker riêng lẻ.
 *     Virtual spread markers vẫn bị library gom cluster nếu zoom quá nhỏ.
 *   - Giải pháp lâu dài: chuyển sang @rnmapbox/maps (SymbolLayer + ShapeSource)
 *     hoặc render spiderfy overlay ngoài MapView bằng pointForCoordinate() API.
 */

import { VoicePin, VoiceType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useState, useCallback, forwardRef, memo, useMemo } from "react";
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
import { useSpiderfy } from "@/hooks/useSpiderfy";
import SpiderfyMarker from "./SpiderfyMarker";
import SpiderfyLegs from "./SpiderfyLegs";


const DEFAULT_DELTA = 0.01;
const FALLBACK_LAT = 10.7769;
const FALLBACK_LNG = 106.7009;

/** Lowered threshold to 2 to enable clustering for small groups of pins without crashing. */
const MIN_PINS_FOR_CLUSTERING = 2;

type Props = {
  location: Location.LocationObject | null;
  pins: VoicePin[];
  isScanning?: boolean;
  discoveredPin?: VoicePin | null;
  onPressDiscoveredPin?: () => void;
  externalSelectedPin?: VoicePin | null;
  onSelectPin?: (pin: VoicePin | null) => void;
  onDeletePin?: (id: number) => void;
  autoPlayPin?: boolean;
  onRegionChangeComplete?: (region: Region) => void;
};

function mapContainerPropsAreEqual(prev: Readonly<Props>, next: Readonly<Props>): boolean {
  if (prev.isScanning !== next.isScanning) return false;
  if (prev.autoPlayPin !== next.autoPlayPin) return false;
  if (prev.externalSelectedPin?.id !== next.externalSelectedPin?.id) return false;
  if (prev.discoveredPin?.id !== next.discoveredPin?.id) return false;
  if (prev.onRegionChangeComplete !== next.onRegionChangeComplete) return false;
  if (prev.onSelectPin !== next.onSelectPin) return false;
  if (prev.onPressDiscoveredPin !== next.onPressDiscoveredPin) return false;

  const pc = prev.location?.coords;
  const nc = next.location?.coords;
  if (pc?.latitude !== nc?.latitude || pc?.longitude !== nc?.longitude) return false;

  if (prev.pins.length !== next.pins.length) return false;
  const sig = (pins: VoicePin[]) =>
    [...pins]
      .map((p) => p.id)
      .sort((a, b) => Number(a) - Number(b))
      .join(",");
  if (sig(prev.pins) !== sig(next.pins)) return false;

  return true;
}

const MapSection = forwardRef<MapView, Props>(function MapSection(
  {
  location,
  pins,
  isScanning = false,
  discoveredPin,
  onPressDiscoveredPin,
  externalSelectedPin,
  onSelectPin,
  onDeletePin,
  autoPlayPin = false,
  onRegionChangeComplete,
},
  ref
) {
  const [internalSelectedPin, setInternalSelectedPin] = useState<VoicePin | null>(null);

  const selectedPin = externalSelectedPin !== undefined ? externalSelectedPin : internalSelectedPin;
  const setSelectedPin = (pin: VoicePin | null) => {
    if (onSelectPin) {
      onSelectPin(pin);
    } else {
      setInternalSelectedPin(pin);
    }
  };

  // ── Spiderfy ──────────────────────────────────────────────────────────────
  const { spiderfyState, isSpiderfyExiting, activateSpiderfy, collapseSpiderfy, cleanupSpiderfy } =
    useSpiderfy();

  /** Map each unique coordinate key to the list of pins sharing it. */
  const pinsByCoord = useMemo(() => {
    const map = new Map<string, VoicePin[]>();
    for (const pin of pins) {
      const key = `${pin.latitude.toFixed(6)},${pin.longitude.toFixed(6)}`;
      map.set(key, [...(map.get(key) ?? []), pin]);
    }
    return map;
  }, [pins]);

  /**
   * IDs of pins currently being displayed as virtual spiderfy markers.
   * Their real markers are hidden to avoid showing a stacked pile underneath.
   * With clustering kept ON, the cluster for these pins dissolves naturally
   * because their Marker children are removed from the tree.
   */
  const spiderfyPinIds = useMemo(
    () => new Set(spiderfyState?.virtualPins.map((vp) => vp.pin.id) ?? []),
    [spiderfyState],
  );

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

  const renderCluster = useCallback(
    (cluster: {
      id: number;
      geometry: { coordinates: [number, number] };
      onPress: () => void;
      properties: { point_count: number };
    }) => {
      const { id, geometry, onPress, properties } = cluster;
      const count: number = properties.point_count;
      const clusterLat = geometry.coordinates[1];
      const clusterLng = geometry.coordinates[0];
      const coord = { latitude: clusterLat, longitude: clusterLng };

      // Detect pile-up: find any coordinate group with 2+ pins that sits
      // within CLUSTER_EPSILON degrees of the cluster centroid.
      // Avoid exact-match because supercluster shifts the centroid when mixing
      // pile-up pins with nearby scattered ones.
      const CLUSTER_EPSILON = 0.002; // ~200 m
      let pileUpGroup: VoicePin[] = [];
      for (const [, group] of pinsByCoord.entries()) {
        if (group.length < 2) continue;
        const { latitude: gLat, longitude: gLng } = group[0];
        if (
          Math.abs(gLat - clusterLat) < CLUSTER_EPSILON &&
          Math.abs(gLng - clusterLng) < CLUSTER_EPSILON &&
          group.length > pileUpGroup.length
        ) {
          pileUpGroup = group;
        }
      }
      const isPileUp = pileUpGroup.length >= 2;
      const handlePress = isPileUp
        ? () => activateSpiderfy(pileUpGroup[0].latitude, pileUpGroup[0].longitude, pileUpGroup)
        : onPress;

      const size = count < 5 ? 46 : count < 15 ? 54 : 64;
      const bg = count < 5 ? "#a5b4fc" : count < 15 ? "#8b5cf6" : "#6d28d9";
      return (
        <ClusterMarker key={id} id={id} coordinate={coord} count={count} size={size} bg={bg} onPress={handlePress} />
      );
    },
    [pinsByCoord, activateSpiderfy]
  );

  // Keep clusteringEnabled always ON — toggling it off forces all accumulated
  // pins to render as individual native markers at once, crashing iOS.
  // Spiderfy pins are removed from the Marker children (spiderfyPinIds filter)
  // which dissolves their cluster naturally without a mass marker explosion.
  const clusteringEnabled = pins.length >= MIN_PINS_FOR_CLUSTERING;
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
        onPress={() => collapseSpiderfy()}
        onPanDrag={() => collapseSpiderfy()}
        onRegionChange={() => collapseSpiderfy()}
        clusteringEnabled={clusteringEnabled}
        spiralEnabled={false}
        radius={30}
        minPoints={2}
        extent={512}
        nodeSize={64}
        renderCluster={renderCluster}
      >
        {pins.filter((pin) => !spiderfyPinIds.has(pin.id)).map((pin) => {
          const isAR = pin.type === VoiceType.HIDDEN_AR;

          const imageSource = (() => {
            const userAvatar = pin.user?.avatar;
            if (!userAvatar) return require('../../assets/images/marker_hidden_voice.png');
            if (userAvatar.startsWith('http')) return { uri: userAvatar };
            const fullUrl = `${BASE_URL}${userAvatar.startsWith('/') ? '' : '/'}${userAvatar}`;
            return { uri: fullUrl };
          })();

          return (
            <Marker
              key={pin.id}
              coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
              onPress={() => {
                const key = `${pin.latitude.toFixed(6)},${pin.longitude.toFixed(6)}`;
                const group = pinsByCoord.get(key) ?? [];
                if (group.length > 1) {
                  activateSpiderfy(pin.latitude, pin.longitude, group);
                } else {
                  setSelectedPin(pin);
                }
              }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
            >
              {/* Custom pin marker */}
              {!pin.user?.avatar ? (
                <Image
                  source={imageSource}
                  style={{ width: 70, height: 70 }}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.markerWrap}>
                  <View style={[styles.markerBubble, isAR && styles.markerBubbleAR]}>
                    <Image
                      source={imageSource}
                      style={styles.markerAvatar}
                    />
                    {/* Small icon overlay to indicate type */}
                    <View style={[styles.typeIndicator, { backgroundColor: "#8b5cf6" }]}>
                      <Ionicons
                        name={isAR ? "sparkles" : "mic"}
                        size={8}
                        color="#fff"
                      />
                    </View>
                  </View>
                  <View style={[styles.markerTail, isAR && styles.markerTailAR]} />
                </View>
              )}

              {/* Callout card */}
              <Callout tooltip onPress={() => setSelectedPin(pin)}>
                <View style={styles.callout}>
                  <View style={styles.calloutHeader}>
                    <Ionicons
                      name={isAR ? "sparkles-outline" : "mic-outline"}
                      size={13}
                      color="#8b5cf6"
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
            key={`discovered-${discoveredPin.id}`}
            pin={discoveredPin}
            onPress={() => onPressDiscoveredPin?.()}
          />
        )}

        {/* ── Spiderfy overlay ─────────────────────────────────────── */}
        {spiderfyState && (
          <>
            <SpiderfyLegs state={spiderfyState} />
            {spiderfyState.virtualPins.map((vp, i) => (
              <SpiderfyMarker
                key={`spiderfy-${vp.pin.id}`}
                virtualPin={vp}
                index={i}
                isExiting={isSpiderfyExiting}
                onPress={() => {
                  collapseSpiderfy();
                  setSelectedPin(vp.pin);
                }}
                onAnimationEnd={
                  i === spiderfyState.virtualPins.length - 1
                    ? cleanupSpiderfy
                    : undefined
                }
              />
            ))}
          </>
        )}
      </MapViewClustering>


      <RadarOverlay isScanning={isScanning} />

      {/* Full-screen overlay when pin selected */}
      {selectedPin && (
        <VoicePinCard
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          onDelete={() => {
            if (onDeletePin) onDeletePin(selectedPin.id);
            setSelectedPin(null);
          }}
          autoPlay={autoPlayPin && selectedPin.id === discoveredPin?.id}
        />
      )}
    </View>
  );
});

MapSection.displayName = "MapSection";

export default memo(MapSection, mapContainerPropsAreEqual);

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
