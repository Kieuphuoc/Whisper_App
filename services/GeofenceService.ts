import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { VoicePin } from '@/types';
import { isExpoTaskManagerAvailable } from '@/utils/nativeModulesAvailability';

export const GEOFENCE_TASK_NAME = 'GEOFENCE_VOICEPIN_TASK';

// Cấu hình hiển thị thông báo khi app đang mở (foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

let geofenceTaskRegistered = false;

function ensureGeofenceTaskDefined(): boolean {
    if (geofenceTaskRegistered) return isExpoTaskManagerAvailable();
    geofenceTaskRegistered = true;

    if (!isExpoTaskManagerAvailable()) {
        console.warn('[GeofenceService] expo-task-manager native module not available — rebuild dev client');
        return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const TaskManager = require('expo-task-manager') as typeof import('expo-task-manager');

    if (TaskManager.isTaskDefined(GEOFENCE_TASK_NAME)) {
        return true;
    }

    TaskManager.defineTask(GEOFENCE_TASK_NAME, ({ data: { eventType, region }, error }: any) => {
        if (error) {
            console.error(`[Geofence Task] Error: ${error.message}`);
            return;
        }

        if (eventType === Location.GeofencingEventType.Enter) {
            console.log(`[Geofence Task] Entered region: ${region.identifier}`);

            Notifications.scheduleNotificationAsync({
                content: {
                    title: "📍 Whisper AR gần đây!",
                    body: "Bạn vừa đi ngang qua một kỷ niệm ẩn. Hãy mở ứng dụng để khám phá ngay!",
                    data: { pinId: region.identifier, type: 'AR_PIN_NEARBY' },
                    sound: true,
                },
                trigger: null,
            });
        }
    });

    return true;
}

// 2. Service quản lý đăng ký/hủy Geofence
export const GeofenceService = {
    /**
     * Đăng ký danh sách các điểm Geofence cho VoicePin AR
     * Hệ điều hành giới hạn khoảng 20 điểm/ứng dụng, nên ta chỉ đăng ký các điểm gần nhất.
     */
    async registerNearbyPins(pins: VoicePin[]) {
        if (!ensureGeofenceTaskDefined()) return;

        const arPins = pins.filter(p => p.type === 'HIDDEN_AR' || (p.type as any) === 'HIDDEN_AR');

        if (arPins.length === 0) {
            await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
            return;
        }

        const regions: Location.LocationRegion[] = arPins.slice(0, 20).map(pin => ({
            identifier: String(pin.id),
            latitude: pin.latitude,
            longitude: pin.longitude,
            radius: pin.unlockRadius || 100,
            notifyOnEnter: true,
            notifyOnExit: false,
        }));

        try {
            const { status } = await Location.getBackgroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('[GeofenceService] Background location permission not granted');
                return;
            }

            await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
            console.log(`[GeofenceService] Registered ${regions.length} geofences.`);
        } catch (err) {
            console.error('[GeofenceService] Failed to start geofencing', err);
        }
    },

    async stopAll() {
        if (!isExpoTaskManagerAvailable()) return;

        try {
            const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK_NAME);
            if (started) {
                await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
            }
        } catch (err) {
            // ignore
        }
    }
};
