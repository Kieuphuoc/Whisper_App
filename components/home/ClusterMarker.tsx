import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";

type Props = {
  id: string | number;
  coordinate: { latitude: number; longitude: number };
  count: number;
  size: number;
  bg: string;
  onPress: () => void;
};

const ENTER_MS = 180;
const UPDATE_PULSE_MS = 140;
const PRESS_PULSE_MS = 160;
const TRACKS_ON_MS = 420;

export default function ClusterMarker({ id, coordinate, count, size, bg, onPress }: Props) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const tracksTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  const prevSig = useRef<string>("");
  const sig = useMemo(() => `${count}|${size}|${bg}`, [count, size, bg]);

  const enableTracksBriefly = () => {
    setTracksViewChanges(true);
    if (tracksTimer.current) clearTimeout(tracksTimer.current);
    tracksTimer.current = setTimeout(() => setTracksViewChanges(false), TRACKS_ON_MS);
  };

  useEffect(() => {
    enableTracksBriefly();

    opacity.value = withTiming(1, { duration: ENTER_MS, easing: Easing.out(Easing.cubic) });
    scale.value = withTiming(1, { duration: ENTER_MS, easing: Easing.out(Easing.cubic) });

    return () => {
      if (tracksTimer.current) clearTimeout(tracksTimer.current);
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!prevSig.current) {
      prevSig.current = sig;
      return;
    }
    if (prevSig.current === sig) return;
    prevSig.current = sig;

    enableTracksBriefly();
    scale.value = withSequence(
      withTiming(1.06, { duration: UPDATE_PULSE_MS, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: UPDATE_PULSE_MS, easing: Easing.out(Easing.quad) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const onPressWithPulse = () => {
    enableTracksBriefly();
    scale.value = withSequence(
      withTiming(0.92, { duration: PRESS_PULSE_MS, easing: Easing.out(Easing.quad) }),
      withTiming(1.08, { duration: PRESS_PULSE_MS, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: PRESS_PULSE_MS, easing: Easing.out(Easing.quad) }),
      withDelay(0, withTiming(1, { duration: 1 }))
    );
    opacity.value = withSequence(
      withTiming(0.92, { duration: PRESS_PULSE_MS, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: PRESS_PULSE_MS, easing: Easing.out(Easing.quad) })
    );

    // Delay onPress a bit so the user sees the pulse.
    setTimeout(onPress, 120);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Marker
      key={`cluster-${id}`}
      coordinate={coordinate}
      onPress={onPressWithPulse}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
    >
      <Animated.View
        style={[
          styles.cluster,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: bg + "dd" },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.clusterInner,
            { width: size - 12, height: size - 12, borderRadius: (size - 12) / 2, backgroundColor: bg },
          ]}
        >
          <Text style={styles.clusterCount}>{count}</Text>
        </View>
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
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
});

