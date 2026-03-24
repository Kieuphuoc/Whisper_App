import { Asset } from "expo-asset";
import { GLView } from "expo-gl";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { PixelRatio, StyleSheet, View } from "react-native";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";

type Props = {
  xOffsetPx: number;
  intensity: number; // 0..1
  placed: boolean;
};

const MODEL_ASSET = require("../../assets/models/charmander.glb");

function dbg(runId: string, hypothesisId: string, location: string, message: string, data?: Record<string, unknown>) {
  // #region agent log
  fetch("http://127.0.0.1:7563/ingest/7bee5893-5664-4b9f-a0df-553827003edb", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "4a5a19" },
    body: JSON.stringify({
      sessionId: "4a5a19",
      runId,
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log
}

export default function CharmanderOverlay({ xOffsetPx, intensity, placed }: Props) {
  const glRef = useRef<any>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const [layout, setLayout] = useState<{ w: number; h: number } | null>(null);

  const clampedIntensity = useMemo(() => Math.max(0, Math.min(1, intensity)), [intensity]);

  // Freeze xOffset when placed.
  const placedXRef = useRef<number>(0);
  useEffect(() => {
    if (placed) placedXRef.current = xOffsetPx;
  }, [placed, xOffsetPx]);
  const effectiveX = placed ? placedXRef.current : xOffsetPx;

  useEffect(() => {
    dbg("run1", "H1", "components/voice-ar/CharmanderOverlay.tsx:62", "mount", {
      placed,
      xOffsetPx,
      intensity: clampedIntensity,
    });
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastTsRef.current = null;
      dbg("run1", "H1", "components/voice-ar/CharmanderOverlay.tsx:72", "unmount");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startLoop = () => {
    const step = (ts: number) => {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      const gl = glRef.current;
      const model = modelRef.current;
      if (!renderer || !scene || !camera || !gl) return;

      const last = lastTsRef.current ?? ts;
      lastTsRef.current = ts;
      const dt = Math.min(0.05, Math.max(0.001, (ts - last) / 1000));

      if (model) {
        model.rotation.y += dt * (0.35 + 0.35 * clampedIntensity);
        model.position.x = (effectiveX / 150) * 0.9;
        const baseScale = 0.55;
        const scale = baseScale * (0.8 + 0.35 * clampedIntensity);
        model.scale.setScalar(scale);
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
      frameRef.current = requestAnimationFrame(step);
    };

    if (frameRef.current == null) frameRef.current = requestAnimationFrame(step);
  };

  const onContextCreate = async (gl: any) => {
    try {
      glRef.current = gl;
      const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
      dbg("run1", "H2", "components/voice-ar/CharmanderOverlay.tsx:120", "gl_context_created", {
        width,
        height,
      });

      gl.canvas = {
        width,
        height,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: height,
        clientWidth: width,
      };

      const renderer = new THREE.WebGLRenderer({ context: gl, antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100);
      camera.position.set(0, 0.4, 2.5);
      camera.lookAt(0, 0.3, 0);
      cameraRef.current = camera;

      scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.0));
      const dir = new THREE.DirectionalLight(0xffffff, 1.1);
      dir.position.set(1.5, 2.2, 1.2);
      scene.add(dir);

      const asset = Asset.fromModule(MODEL_ASSET);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      dbg("run1", "H3", "components/voice-ar/CharmanderOverlay.tsx:159", "asset_ready", { hasLocal: !!asset.localUri });

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(uri);
      const model = gltf.scene;
      modelRef.current = model;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.position.y -= box.min.y;
      model.position.y += 0.05;
      model.rotation.y = Math.PI * 0.15;
      scene.add(model);
      dbg("run1", "H3", "components/voice-ar/CharmanderOverlay.tsx:175", "model_loaded", {
        boxSize: box.getSize(new THREE.Vector3()).toArray(),
      });

      startLoop();
    } catch (e: any) {
      dbg("run1", "H4", "components/voice-ar/CharmanderOverlay.tsx:183", "overlay_error", {
        message: String(e?.message ?? e),
      });
    }
  };

  useEffect(() => {
    if (!layout) return;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const gl = glRef.current;
    if (!renderer || !camera || !gl) return;

    const dpr = PixelRatio.get();
    const width = Math.max(1, Math.floor(layout.w * dpr));
    const height = Math.max(1, Math.floor(layout.h * dpr));
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    dbg("run1", "H2", "components/voice-ar/CharmanderOverlay.tsx:205", "resize", { width, height, dpr });
  }, [layout]);

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.wrap,
        {
          opacity: 0.25 + 0.75 * clampedIntensity,
        },
      ]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ w: width, h: height });
      }}
    >
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { zIndex: 2 },
});

