import { requireOptionalNativeModule } from "expo-modules-core";

export function isExpoTaskManagerAvailable(): boolean {
  return requireOptionalNativeModule("ExpoTaskManager") != null;
}

export function isViroNativeAvailable(): boolean {
  return requireOptionalNativeModule("VRTMaterialManager") != null;
}
