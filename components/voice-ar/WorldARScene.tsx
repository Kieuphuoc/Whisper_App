import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import {
  Viro3DObject,
  ViroARPlaneSelector,
  ViroARScene,
  ViroARSceneNavigator,
  ViroAmbientLight,
  ViroDirectionalLight,
  isARSupportedOnDevice,
  requestRequiredPermissions,
} from "@reactvision/react-viro";
import { Text } from "@/components/ui/text";

type Props = {
  modelUri: string;
  modelScale?: number;
  onPlaced?: () => void;
  onLoadError?: (message: string) => void;
};

function ARSceneContent({
  modelUri,
  modelScale,
  onPlaced,
  onLoadError,
}: Props) {
  const [planeSelected, setPlaneSelected] = useState(false);

  return (
    <ViroARScene anchorDetectionTypes={["Horizontal"]}>
      <ViroAmbientLight color="#ffffff" intensity={280} />
      <ViroDirectionalLight direction={[0, -1, -0.35]} color="#ffffff" castsShadow={true} />

      <ViroARPlaneSelector
        alignment="Horizontal"
        minHeight={0.12}
        minWidth={0.12}
        hideOverlayOnSelection={true}
        onPlaneSelected={() => {
          setPlaneSelected(true);
          onPlaced?.();
        }}
      >
        {planeSelected ? (
          <Viro3DObject
            source={{ uri: modelUri }}
            type="GLB"
            scale={[modelScale ?? 0.2, modelScale ?? 0.2, modelScale ?? 0.2]}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            onLoadEnd={() => {}}
            onError={(e) => {
              const msg = (e as { nativeEvent?: { error?: string } })?.nativeEvent?.error ?? "Không tải được model 3D";
              onLoadError?.(msg);
            }}
          />
        ) : null}
      </ViroARPlaneSelector>
    </ViroARScene>
  );
}

export default function WorldARScene({ modelUri, modelScale, onPlaced, onLoadError }: Props) {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [permDenied, setPermDenied] = useState(false);
  const placedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ar = await isARSupportedOnDevice();
        if (cancelled) return;
        const ok = ar.isARSupported === true;
        setSupported(ok);
        if (!ok) return;

        const perms = await requestRequiredPermissions(["camera"]);
        if (cancelled) return;
        const granted = perms.camera === true;
        setPermDenied(!granted);
        setReady(granted);
      } catch {
        if (!cancelled) setSupported(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePlaced = useCallback(() => {
    if (placedRef.current) return;
    placedRef.current = true;
    onPlaced?.();
  }, [onPlaced]);

  const sceneFactory = useMemo(() => {
    return () => (
      <ARSceneContent
        modelUri={modelUri}
        modelScale={modelScale}
        onPlaced={handlePlaced}
        onLoadError={onLoadError}
      />
    );
  }, [modelUri, modelScale, handlePlaced, onLoadError]);

  if (supported === null || (supported && !ready && !permDenied)) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#a78bfa" size="large" />
        <Text style={styles.hint}>Đang khởi động AR…</Text>
      </View>
    );
  }

  if (supported === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Thiết bị không hỗ trợ AR</Text>
        <Text style={styles.hint}>
          Cần iPhone/iPad có ARKit hoặc Android có ARCore. {Platform.OS === "ios" ? "Simulator không hỗ trợ AR thật." : ""}
        </Text>
      </View>
    );
  }

  if (permDenied) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Cần quyền camera</Text>
        <Text style={styles.hint}>Cho phép camera (và vị trí nếu được hỏi) để quét mặt phẳng và đặt vật thể 3D.</Text>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: sceneFactory }}
        style={styles.fill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0a0a0f",
    gap: 10,
  },
  title: { color: "#fff", fontWeight: "900", fontSize: 16, textAlign: "center" },
  hint: { color: "rgba(255,255,255,0.75)", fontSize: 13, textAlign: "center", lineHeight: 20 },
});
