import { voicePin } from "@/data/voicePin";
import { VoicePin, VoiceType } from "@/types";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import VoiceBloom from "./VoiceBloom";
import VoicePinCard from "./VoicePinCard";

type Props = {
  location: Location.LocationObject | null;
};

export default function MapSection({ location }: Props) {
  const [selectedPin, setSelectedPin] = useState<VoicePin | null>(null);
  const [bloomPins, setBloomPins] = useState<VoicePin[] | null>(null);

  if (!location)
    return (
      <View style={styles.center}>
        <Text>Getting location...</Text>
      </View>
    );

  return (
    <View style={styles.map}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {voicePin.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{
              latitude: pin.latitude,
              longitude: pin.longitude,
            }}
            title={pin.type === VoiceType.HIDDEN_AR ? "Hidden Voice" : "Voice Pin"}
            description={pin.content}
            pinColor={
              pin.type === VoiceType.HIDDEN_AR ? "purple" : "red"
            }
            onPress={() => setSelectedPin(pin)}
          >
            <Text style={{ fontSize: 28 }}>😭</Text>
          </Marker>

        ))}
        {bloomPins && (
          <VoiceBloom
            pins={bloomPins}
            onSelect={(pin) => {
              setBloomPins(null);
              router.push(`/voice/${pin.id}`);
            }}
            onClose={() => setBloomPins(null)}
          />
        )}

      </MapView>
      {selectedPin && (<VoicePinCard pin={selectedPin} onClose={() => setSelectedPin(null)} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
