import React, { forwardRef, useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import Mapbox from "@/configs/Mapbox";
import { VoicePin, VoiceType } from "@/types";
import { Region } from "react-native-maps";
import * as Location from "expo-location";
import { pinsToGeoJSON } from "@/utils/mapGeoConverter";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import VoicePinCard from "./VoicePinCard";
import RadarOverlay from "../discovery/RadarOverlay";
import { BASE_URL } from "@/configs/Apis";

interface Props {
  location: Location.LocationObject | null;
  pins: VoicePin[];
  isScanning?: boolean;
  discoveredPin?: VoicePin | null;
  onPressDiscoveredPin?: () => void;
  externalSelectedPin?: VoicePin | null;
  onSelectPin?: (pin: VoicePin | null) => void;
  autoPlayPin?: boolean;
  onRegionChangeComplete?: (region: Region) => void;
}

const FALLBACK_COORD: [number, number] = [106.7009, 10.7769]; // [lng, lat] - Sửa lat từ 107 thành 10

const MapboxContainer = forwardRef<Mapbox.MapView, Props>((props, ref) => {
  const {
    location,
    pins,
    isScanning,
    discoveredPin,
    onPressDiscoveredPin,
    externalSelectedPin,
    onSelectPin,
    autoPlayPin,
    onRegionChangeComplete,
  } = props;

  const [internalSelectedPin, setInternalSelectedPin] = useState<VoicePin | null>(null);
  const [currentZoom, setCurrentZoom] = useState(14);
  const lastRegionKeyRef = useRef<string | null>(null);
  const selectedPin = externalSelectedPin !== undefined ? externalSelectedPin : internalSelectedPin;

  const setSelectedPin = (pin: VoicePin | null) => {
    if (onSelectPin) {
      onSelectPin(pin);
    } else {
      setInternalSelectedPin(pin);
    }
  };

  // Chuyển đổi dữ liệu sang GeoJSON
  const geoJSONData = useMemo(() => pinsToGeoJSON(pins), [pins]);

  const handleClusterPress = useCallback(async (event: any) => {
    const feature = event.features[0];
    if (feature.properties?.cluster && ref && 'current' in ref && ref.current) {
      const clusterId = feature.properties.cluster_id;
      // Trong một số phiên bản, chúng ta có thể lấy zoom tiếp theo
      // Nhưng đơn giản nhất là zoom in thêm 2 level tại tọa độ đó
      (ref.current as any).setCamera({
        centerCoordinate: feature.geometry.coordinates,
        zoomLevel: (await (ref.current as any).getZoom()) + 2,
        animationDuration: 400,
      });
    }
  }, [ref]);

  const handleRegionChange = useCallback((state: any) => {
    const zoomLevel = state.properties?.zoomLevel;
    if (typeof zoomLevel === "number") {
      setCurrentZoom((prevZoom) => (Math.abs(prevZoom - zoomLevel) >= 0.01 ? zoomLevel : prevZoom));
    }
    
    if (onRegionChangeComplete && state.properties?.visibleBounds) {
      const [[neLng, neLat], [swLng, swLat]] = state.properties.visibleBounds;
      const latitude = (neLat + swLat) / 2;
      const longitude = (neLng + swLng) / 2;
      const latitudeDelta = Math.abs(neLat - swLat);
      const longitudeDelta = Math.abs(neLng - swLng);
      const regionKey = [
        latitude.toFixed(4),
        longitude.toFixed(4),
        latitudeDelta.toFixed(4),
        longitudeDelta.toFixed(4),
      ].join("|");

      if (lastRegionKeyRef.current === regionKey) {
        return;
      }
      lastRegionKeyRef.current = regionKey;

      if (__DEV__) {
        console.log(
          `[Mapbox] Region Change: lat=${latitude.toFixed(6)}, lng=${longitude.toFixed(6)}, dLat=${latitudeDelta.toFixed(6)}, dLng=${longitudeDelta.toFixed(6)}, zoom=${zoomLevel?.toFixed(2)}`
        );
      }


      onRegionChangeComplete({
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
      });
    }
  }, [onRegionChangeComplete]);

  if (!location) return null;

  return (
    <View style={styles.container}>
      <Mapbox.MapView
        ref={ref}
        style={styles.map}
        styleURL={Mapbox.StyleURL.Dark} 
        logoEnabled={false}
        onRegionDidChange={handleRegionChange}
      >
        <Mapbox.Camera
          ref={(c) => {
            // Có thể dùng camera ref nếu cần
          }}
          defaultSettings={{
            centerCoordinate: [location.coords.longitude, location.coords.latitude],
            zoomLevel: currentZoom,
          }}
        />

        <Mapbox.UserLocation animated showsUserHeadingIndicator />

        {/* Tạm thời tắt 3D Buildings để tránh crash native */}
        {/* <Mapbox.FillExtrusionLayer
          id="3d-buildings"
          sourceID="composite"
          sourceLayerID="building"
          minZoomLevel={15}
          maxZoomLevel={22}
          filter={['==', ['extrude'], 'true']}
          style={{
            fillExtrusionColor: '#333',
            fillExtrusionHeight: ['get', 'height'],
            fillExtrusionBase: ['get', 'min_height'],
            fillExtrusionOpacity: 0.6,
          }}
        /> */}

        {/* Source for Clustering */}
        <Mapbox.ShapeSource
          id="pins-source"
          shape={geoJSONData}
          cluster
          clusterRadius={50}
          onPress={handleClusterPress}
        >
          {/* Cluster Circles - Hiển thị vòng tròn cho nhóm */}
          <Mapbox.CircleLayer
            id="cluster-circles"
            filter={['has', 'point_count']}
            style={{
              circleColor: [
                'step',
                ['get', 'point_count'],
                '#ef4444', 10,
                '#f97316', 50,
                '#8b5cf6'
              ],
              circleRadius: [
                'step',
                ['get', 'point_count'],
                18, 10,
                22, 50,
                28
              ],
              circleStrokeWidth: 3,
              circleStrokeColor: 'rgba(255, 255, 255, 0.6)',
              circleOpacity: 0.9,
            }}
          />

          {/* Cluster Counts - Hiển thị số lượng trong nhóm */}
          <Mapbox.SymbolLayer
            id="cluster-counts"
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count_abbreviated'],
              textSize: 12,
              textColor: '#ffffff',
              textFont: ['Open Sans Bold', 'Arial Unicode MS Bold'],
              textPitchAlignment: 'map',
            }}
          />

          {/* Unclustered Points - Hiển thị các điểm đơn lẻ khi chưa zoom đủ sâu (Dự phòng) */}
          <Mapbox.CircleLayer
            id="single-pins-layer"
            filter={['!', ['has', 'point_count']]}
            style={{
              circleColor: '#ef4444',
              circleRadius: 10,
              circleStrokeWidth: 2,
              circleStrokeColor: '#ffffff',
              circleOpacity: [
                'step',
                ['zoom'],
                1,
                13,
                0 // Ẩn khi zoom >= 13 để nhường chỗ cho MarkerView (avatars)
              ],
              circleStrokeOpacity: [
                'step',
                ['zoom'],
                1,
                13,
                0
              ],
            }}
          />
        </Mapbox.ShapeSource>

        {/* 
          Chỉ hiển thị MarkerView chi tiết khi zoom đủ lớn (>= 13). 
          Khi zoom nhỏ, các vòng tròn Cluster sẽ đại diện cho các ghim để bản đồ mượt và gọn hơn.
        */}
        {currentZoom >= 13 && pins.map((pin) => (
          <Mapbox.MarkerView
            key={`marker-${pin.id}`}
            id={`pin-${pin.id}`}
            coordinate={[pin.longitude, pin.latitude]}
            allowOverlap={true}
            anchor={{ x: 0.5, y: 1 }}
          >
            <TouchableOpacity 
              onPress={() => setSelectedPin(pin)}
              style={styles.markerWrap}
              activeOpacity={0.8}
            >
              <View style={[
                styles.markerBubble, 
                pin.type === VoiceType.HIDDEN_AR && styles.markerBubbleAR
              ]}>
                <Image
                  source={
                    pin.user?.avatar 
                      ? { uri: pin.user.avatar.includes('http') ? pin.user.avatar : `${BASE_URL}${pin.user.avatar.startsWith('/') ? '' : '/'}${pin.user.avatar}` }
                      : require('../../assets/images/marker_hidden_voice.png')
                  }
                  style={styles.markerAvatar}
                  resizeMode="cover"
                />
                
                {pin.type === VoiceType.HIDDEN_AR && (
                  <View style={styles.typeIndicator}>
                    <Ionicons name="sparkles" size={8} color="#fff" />
                  </View>
                )}
              </View>
              <View style={[
                styles.markerTail,
                pin.type === VoiceType.HIDDEN_AR && styles.markerTailAR
              ]} />
            </TouchableOpacity>
          </Mapbox.MarkerView>
        ))}

        {discoveredPin && (
          <Mapbox.MarkerView
            key={`discovered-${discoveredPin.id}`}
            id={`discovered-pin-${discoveredPin.id}`}
            coordinate={[discoveredPin.longitude, discoveredPin.latitude]}
            anchor={{ x: 0.5, y: 1 }}
          >
            <TouchableOpacity 
              onPress={() => onPressDiscoveredPin && onPressDiscoveredPin()}
              style={styles.discoveredMarkerWrap}
            >
              <View style={styles.discoveredPulse} />
              <View style={styles.markerBubbleDiscover}>
                <Image
                  source={
                    discoveredPin.user?.avatar 
                      ? { uri: discoveredPin.user.avatar.includes('http') ? discoveredPin.user.avatar : `${BASE_URL}${discoveredPin.user.avatar.startsWith('/') ? '' : '/'}${discoveredPin.user.avatar}` }
                      : require('../../assets/images/marker_hidden_voice.png')
                  }
                  style={styles.markerAvatar}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.markerTailDiscover} />
            </TouchableOpacity>
          </Mapbox.MarkerView>
        )}
      </Mapbox.MapView>

      <RadarOverlay isScanning={isScanning ?? false} />

      {selectedPin && (
        <VoicePinCard
          pin={selectedPin}
          onClose={() => setSelectedPin(null)}
          autoPlay={autoPlayPin ?? false}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  markerWrap: { alignItems: "center", width: 44, height: 50 },
  markerBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#fff",
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  markerAvatar: { width: '100%', height: '100%' },
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
  typeIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#8b5cf6",
    borderWidth: 1.5,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  discoveredMarkerWrap: { alignItems: "center", justifyContent: 'center' },
  discoveredPulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
  },
  markerBubbleDiscover: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#8b5cf6",
    overflow: 'hidden',
    elevation: 10,
  },
  markerTailDiscover: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#8b5cf6",
    marginTop: -1,
  },
});

export default MapboxContainer;
