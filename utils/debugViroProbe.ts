/**
 * Debug probe: runs at module load before @reactvision/react-viro imports.
 * Remove after AR native-module investigation is complete.
 */
import Constants from "expo-constants";
import * as Device from "expo-device";
import { NativeModules, Platform } from "react-native";
import { isExpoTaskManagerAvailable, isViroNativeAvailable } from "@/utils/nativeModulesAvailability";

const viroNativeKeys = Object.keys(NativeModules).filter((k) => /viro|VRT/i.test(k));
const viroViaExpoModules = isViroNativeAvailable();
const taskManagerViaExpoModules = isExpoTaskManagerAvailable();

// #region agent log
fetch("http://127.0.0.1:7829/ingest/801e5de0-d8de-4810-953e-bfee09b4c905", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bd82cd" },
  body: JSON.stringify({
    sessionId: "bd82cd",
    runId: "pre-fix",
    hypothesisId: "A",
    location: "utils/debugViroProbe.ts:env",
    message: "Runtime environment for Viro",
    data: {
      platform: Platform.OS,
      isDevice: Device.isDevice,
      modelName: Device.modelName ?? null,
      executionEnvironment: Constants.executionEnvironment ?? null,
      appOwnership: Constants.appOwnership ?? null,
      newArchEnabled: (Constants.expoConfig as { newArchEnabled?: boolean } | null)?.newArchEnabled ?? null,
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

// #region agent log
fetch("http://127.0.0.1:7829/ingest/801e5de0-d8de-4810-953e-bfee09b4c905", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bd82cd" },
  body: JSON.stringify({
    sessionId: "bd82cd",
    runId: "pre-fix",
    hypothesisId: "B",
    location: "utils/debugViroProbe.ts:nativeModules",
    message: "Viro-related NativeModules keys",
    data: {
      viroNativeKeys,
      viroNativeKeyCount: viroNativeKeys.length,
      hasVRTMaterialManager: Boolean((NativeModules as Record<string, unknown>).VRTMaterialManager),
      viroViaExpoModules,
      nativeModuleCount: Object.keys(NativeModules).length,
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

// #region agent log
fetch("http://127.0.0.1:7829/ingest/801e5de0-d8de-4810-953e-bfee09b4c905", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bd82cd" },
  body: JSON.stringify({
    sessionId: "bd82cd",
    runId: "pre-fix",
    hypothesisId: "C",
    location: "utils/debugViroProbe.ts:simulator",
    message: "Simulator vs physical device",
    data: {
      isIOSSimulator: Platform.OS === "ios" && !Device.isDevice,
      isAndroidEmulator: Platform.OS === "android" && !Device.isDevice,
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

// #region agent log
fetch("http://127.0.0.1:7829/ingest/801e5de0-d8de-4810-953e-bfee09b4c905", {
  method: "POST",
  headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "bd82cd" },
  body: JSON.stringify({
    sessionId: "bd82cd",
    runId: "pre-fix",
    hypothesisId: "D",
    location: "utils/debugViroProbe.ts:expoNativeDeps",
    message: "Other native modules (dev client freshness)",
    data: {
      hasExpoTaskManager: Boolean((NativeModules as Record<string, unknown>).ExpoTaskManager),
      taskManagerViaExpoModules,
      hasExpoModulesCore: Boolean((NativeModules as Record<string, unknown>).ExpoModulesCore),
    },
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion
