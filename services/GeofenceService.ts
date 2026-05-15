import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { VoicePin } from '@/types';

export const GEOFENCE_TASK_NAME = 'GEOFENCE_VOICEPIN_TASK';

// Cấu hình hiển thị thông báo khi app đang mở (foreground)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

// 1. Định nghĩa Task xử lý sự kiện Geofence (Chạy ngầm ngay cả khi đóng App)
if (TaskManager.isTaskDefined(GEOFENCE_TASK_NAME)) {
    // Task already defined
} else {
    TaskManager.defineTask(GEOFENCE_TASK_NAME, ({ data: { eventType, region }, error }: any) => {
        if (error) {
            console.error(`[Geofence Task] Error: ${error.message}`);
            return;
        }

        if (eventType === Location.GeofencingEventType.Enter) {
            console.log(`[Geofence Task] Entered region: ${region.identifier}`);
            
            // Hiện thông báo cục bộ
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
}

// 2. Service quản lý đăng ký/hủy Geofence
export const GeofenceService = {
    /**
     * Đăng ký danh sách các điểm Geofence cho VoicePin AR
     * Hệ điều hành giới hạn khoảng 20 điểm/ứng dụng, nên ta chỉ đăng ký các điểm gần nhất.
     */
    async registerNearbyPins(pins: VoicePin[]) {
        const arPins = pins.filter(p => p.type === 'HIDDEN_AR' || (p.type as any) === 'HIDDEN_AR');
        
        if (arPins.length === 0) {
            await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
            return;
        }

        // Tạo danh sách các vùng Geofence (tối đa 20 vùng gần nhất để tối ưu OS)
        const regions: Location.LocationRegion[] = arPins.slice(0, 20).map(pin => ({
            identifier: String(pin.id),
            latitude: pin.latitude,
            longitude: pin.longitude,
            radius: pin.unlockRadius || 100, // Bán kính kích hoạt (m)
            notifyOnEnter: true,
            notifyOnExit: false,
        }));

        try {
            // Kiểm tra quyền Always Location
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
