// import "@expo/browser-polyfill";
import { Asset } from "expo-asset";
import { GLView } from "expo-gl";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";

type MinimalDocument = {
  createElement: (tag: string) => unknown;
  createElementNS?: (ns: string, name: string) => unknown;
};

/** THREE.ImageLoader gọi document.createElementNS(ns, name); polyfill @expo chỉ dùng 1 tham số. */
function patchGlobalDocumentForThree() {
  const g = globalThis as typeof globalThis & {
    document?: MinimalDocument;
    window?: { document?: MinimalDocument };
  };
  const doc = g.document ?? g.window?.document;
  if (!doc || typeof doc.createElement !== "function") return;
  g.document = doc as typeof g.document;
  const createElement = doc.createElement.bind(doc) as (tag: string) => unknown;
  doc.createElementNS = (_ns: string, name: string) => createElement(name);
}

patchGlobalDocumentForThree();

/** RN BlobManager rejects ArrayBuffer / ArrayBufferView parts; GLTFLoader uses `new Blob([bufferView])` for embedded images. */
function uint8ToBase64(u8: Uint8Array): string {
  const g = globalThis as typeof globalThis & { btoa?: (s: string) => string };
  if (typeof g.btoa !== "function") {
    throw new Error("btoa unavailable");
  }
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < u8.length; i += chunk) {
    const sub = u8.subarray(i, Math.min(i + chunk, u8.length));
    binary += String.fromCharCode.apply(null, sub as unknown as number[]);
  }
  return g.btoa(binary);
}

/** Route glTF embedded images (bufferView) through data: URIs so THREE never constructs Blob from binary views. */
function installRnGltfEmbeddedImageDataUriPlugin(loader: GLTFLoader) {
  const L = loader as any;
  if (L.__rnGltfDataUriPlugin) return;
  L.__rnGltfDataUriPlugin = true;
  loader.register((parser: any) => {
    const orig = parser.loadImageSource.bind(parser);
    parser.loadImageSource = function loadImageSourceRn(sourceIndex: number, texLoader: any) {
      if (parser.sourceCache[sourceIndex] !== undefined) {
        return parser.sourceCache[sourceIndex].then((t: THREE.Texture) => t.clone());
      }
      const json = parser.json;
      const options = parser.options;
      const sourceDef = json.images[sourceIndex];
      if (sourceDef.bufferView === undefined) {
        return orig(sourceIndex, texLoader);
      }
      const mime = sourceDef.mimeType || "image/png";
      const promise = parser
        .getDependency("bufferView", sourceDef.bufferView)
        .then((bufferView: ArrayBufferView) => {
          const u8 =
            bufferView instanceof Uint8Array
              ? bufferView
              : new Uint8Array(bufferView.buffer, bufferView.byteOffset, bufferView.byteLength);
          const dataUri = `data:${mime};base64,${uint8ToBase64(u8)}`;
          // #region agent log
          fetch("http://127.0.0.1:7829/ingest/801e5de0-d8de-4810-953e-bfee09b4c905", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f14363" },
            body: JSON.stringify({
              sessionId: "f14363",
              runId: "bufferView-data-uri",
              hypothesisId: "H6",
              location: "CharmanderOverlay.tsx:loadImageSourceRn",
              message: "embedded glTF image routed as data URI (no Blob)",
              data: { mime, byteLength: u8.byteLength },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
          return new Promise((resolve, reject) => {
            let onLoad: (value: unknown) => void = resolve;
            if (texLoader.isImageBitmapLoader === true) {
              onLoad = (imageBitmap: unknown) => {
                const texture = new THREE.Texture(imageBitmap as any);
                texture.needsUpdate = true;
                resolve(texture);
              };
            }
            texLoader.load(THREE.LoaderUtils.resolveURL(dataUri, options.path), onLoad, undefined, reject);
          });
        })
        .then((texture: THREE.Texture) => {
          if (sourceDef.extras !== undefined && typeof sourceDef.extras === "object") {
            Object.assign(texture.userData, sourceDef.extras);
          }
          texture.userData.mimeType = sourceDef.mimeType || mime;
          return texture;
        })
        .catch((error: unknown) => {
          console.error("THREE.GLTFLoader: Couldn't load texture", sourceDef);
          throw error;
        });
      parser.sourceCache[sourceIndex] = promise;
      return promise;
    };
    return { name: "RN_GLTF_EMBEDDED_IMAGES" };
  });
}

type Props = {
  xOffsetPx: number;
  intensity: number; // 0..1
  placed: boolean;
};

const MODEL_ASSET = require("../../assets/models/charmander.glb");

function gltfRootPathFromUri(uri: string): string {
  const i = uri.lastIndexOf("/");
  return i >= 0 ? uri.slice(0, i + 1) : "";
}

async function loadGltfFromUri(loader: GLTFLoader, uri: string): Promise<{ scene: THREE.Object3D }> {
  installRnGltfEmbeddedImageDataUriPlugin(loader);
  const res = await fetch(uri);
  if (!res.ok) {
    throw new Error(`GLB fetch failed: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  const path = gltfRootPathFromUri(uri);
  return new Promise((resolve, reject) => {
    loader.parse(
      arrayBuffer,
      path,
      (gltf) => resolve(gltf),
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
    );
  });
}

/** Map màu glTF thường là sRGB; nếu colorSpace trống trên RN, baseColor nhìn sai/nhạt. */
function fixColorMapColorSpace(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    for (const m of mats) {
      if (!(m instanceof THREE.MeshStandardMaterial) && !(m instanceof THREE.MeshPhysicalMaterial)) continue;
      const fix = (tex: THREE.Texture | null | undefined) => {
        if (!tex) return;
        if (!tex.colorSpace || tex.colorSpace === THREE.NoColorSpace) {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.needsUpdate = true;
        }
      };
      fix(m.map);
      fix(m.emissiveMap);
      m.needsUpdate = true;
    }
  });
}

function summarizeMaterials(root: THREE.Object3D) {
  let meshCount = 0;
  const samples: { type: string; hasMap: boolean; mapCS: string }[] = [];
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    meshCount += 1;
    const m = obj.material;
    const mat = Array.isArray(m) ? m[0] : m;
    if (!mat || samples.length >= 6) return;
    const hasMap = !!(mat as THREE.MeshStandardMaterial).map;
    const mapCS = (mat as THREE.MeshStandardMaterial).map?.colorSpace ?? "";
    samples.push({ type: mat.type, hasMap, mapCS });
  });
  return { meshCount, samples };
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
  const [glSyncToken, setGlSyncToken] = useState(0);

  const clampedIntensity = useMemo(() => Math.max(0, Math.min(1, intensity)), [intensity]);

  // Freeze xOffset when placed.
  const placedXRef = useRef<number>(0);
  useEffect(() => {
    if (placed) placedXRef.current = xOffsetPx;
  }, [placed, xOffsetPx]);
  const effectiveX = placed ? placedXRef.current : xOffsetPx;

  useEffect(() => {
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      lastTsRef.current = null;
    };
  }, []);

  const syncRendererToDrawingBuffer = () => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const gl = glRef.current;
    if (!renderer || !camera || !gl) return;
    const w = Math.max(1, gl.drawingBufferWidth);
    const h = Math.max(1, gl.drawingBufferHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

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

      gl.canvas = {
        width,
        height,
        style: {},
        addEventListener: () => {},
        removeEventListener: () => {},
        clientHeight: height,
        clientWidth: width,
      };

      const renderer = new THREE.WebGLRenderer({ context: gl, antialias: false, alpha: true });
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);
      THREE.ColorManagement.enabled = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 100);
      camera.position.set(0, 0.4, 2.5);
      camera.lookAt(0, 0.3, 0);
      cameraRef.current = camera;

      scene.add(new THREE.HemisphereLight(0xffffff, 0x6b5a8f, 1.15));
      const dir = new THREE.DirectionalLight(0xffffff, 1.35);
      dir.position.set(1.5, 2.2, 1.2);
      scene.add(dir);

      const asset = Asset.fromModule(MODEL_ASSET);
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;

      const loader = new GLTFLoader();
      const gltf = await loadGltfFromUri(loader, uri);
      const model = gltf.scene;
      modelRef.current = model;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.position.y -= box.min.y;
      model.position.y += 0.05;
      model.rotation.y = Math.PI * 0.15;
      fixColorMapColorSpace(model);
      scene.add(model);

      // #region agent log
      {
        const scan = summarizeMaterials(model);
        fetch("http://127.0.0.1:7829/ingest/801e5de0-d8de-4810-953e-bfee09b4c905", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f14363" },
          body: JSON.stringify({
            sessionId: "f14363",
            runId: "post-fix",
            hypothesisId: "H4",
            location: "CharmanderOverlay.tsx:afterLoad",
            message: "GLTF display pipeline + material scan",
            data: {
              outputColorSpace: renderer.outputColorSpace,
              toneMapping: renderer.toneMapping,
              colorManagementEnabled: THREE.ColorManagement.enabled,
              ...scan,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion

      syncRendererToDrawingBuffer();
      startLoop();
      setGlSyncToken((t) => t + 1);
    } catch (e) {
      // #region agent log
      fetch("http://127.0.0.1:7829/ingest/801e5de0-d8de-4810-953e-bfee09b4c905", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f14363" },
        body: JSON.stringify({
          sessionId: "f14363",
          runId: "blob-patch",
          hypothesisId: "H5",
          location: "CharmanderOverlay.tsx:onContextCreate",
          message: "GL/model init failed",
          data: { err: String(e) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    }
  };

  // expo-gl: framebuffer size is gl.drawingBufferWidth/Height — must match renderer.setSize
  // (layout * DPR can disagree and produce a blank GLView on device).
  useEffect(() => {
    if (!layout) return;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const gl = glRef.current;
    if (!renderer || !camera || !gl) return;

    syncRendererToDrawingBuffer();
  }, [layout, glSyncToken]);

  return (
    <View
      collapsable={false}
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
      <GLView
        style={StyleSheet.absoluteFill}
        msaaSamples={0}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 900,
    ...(Platform.OS === "android" ? { elevation: 24 } : {}),
  },
});

