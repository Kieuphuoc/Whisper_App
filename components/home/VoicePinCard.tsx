import { VoicePin } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

type Props = {
  pin: VoicePin;
  onClose: () => void;
};

export default function VoicePinTurntable({ pin, onClose }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Animation values
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const armAnim = useRef(new Animated.Value(0)).current; // 0: ngoài, 1: trên đĩa

  useEffect(() => {
    if (isPlaying) {
      // 1. Nhấc cần gạt vào đĩa
      Animated.timing(armAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // 2. Xoay đĩa vô tận
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Ngừng xoay và đưa cần về
      rotateAnim.stopAnimation();
      Animated.timing(armAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const armRotate = armAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "25deg"], // Xoay cần gạt vào đĩa
  });

  return (
    <View style={styles.overlay}>
      <View style={styles.turntableBody}>

        {/* TOP BAR: Logo & Close */}
        <View style={styles.topBar}>
          <Ionicons name="mic-outline" size={20} color="rgba(255,255,255,0.5)" />
          <TouchableOpacity onPress={onClose} hitSlop={15}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* VINYL RECORD SECTION */}
        <View style={styles.playerContainer}>
          <View style={styles.vinylShadow}>
            <Animated.View style={[styles.vinylPlate, { transform: [{ rotate: spin }] }]}>
              <Image
                source={pin.imageUrl ? { uri: pin.imageUrl } : require("@/assets/images/favicon.png")}
                style={styles.recordImage}
              />
              {/* Tâm đĩa hát */}
              <View style={styles.recordCenter} />
            </Animated.View>
          </View>

          {/* TONEARM (Cần gạt) */}
          <Animated.View
            style={[
              styles.tonearmContainer,
              { transform: [{ rotate: armRotate }] }
            ]}
          >
            <View style={styles.tonearmBase} />
            <View style={styles.tonearmStick} />
            <View style={styles.tonearmHead} />
          </Animated.View>
        </View>

        {/* INFO & CONTROLS */}
        <View style={styles.bottomSection}>
          <View>
            <Text style={styles.title} numberOfLines={1}>
              {pin.isAnonymous ? "Unknown Voice" : "Recording #" + String(pin.id).slice(-4)}
            </Text>
            <Text style={styles.subtitle}>
              {new Date(pin.createdAt).toLocaleDateString()} • {pin.visibility}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            style={[styles.playBtn, isPlaying && styles.playBtnActive]}
          >
            <Ionicons name={isPlaying ? "pause" : "play"} size={24} color={isPlaying ? "#000" : "#fff"} />
          </TouchableOpacity>
        </View>

        {/* STATS FOOTER */}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>❤️ {pin.reactionsCount}</Text>
          <Text style={styles.statText}>💬 {pin.commentsCount}</Text>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  turntableBody: {
    width: width * 0.88,
    backgroundColor: "#121212",
    borderRadius: 40,
    padding: 24,
    borderWidth: 1,
    borderColor: "#282828",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  playerContainer: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 30,
  },
  vinylShadow: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#1a1a1a',
  },
  vinylPlate: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
  },
  recordImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  recordCenter: {
    position: 'absolute',
    top: '45%',
    left: '45%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: '#fff',
  },
  tonearmContainer: {
    position: 'absolute',
    top: 20,
    right: 30,
    height: 180,
    width: 50,
    alignItems: 'center',
    zIndex: 5,
  },
  tonearmBase: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    borderWidth: 4,
    borderColor: '#444',
  },
  tonearmStick: {
    width: 6,
    height: 120,
    backgroundColor: '#555',
    marginTop: -5,
  },
  tonearmHead: {
    width: 15,
    height: 25,
    backgroundColor: '#888',
    borderRadius: 4,
    marginTop: -5,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    width: width * 0.5,
  },
  subtitle: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnActive: {
    backgroundColor: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingTop: 15,
  },
  statText: {
    color: '#aaa',
    fontSize: 13,
  }
});