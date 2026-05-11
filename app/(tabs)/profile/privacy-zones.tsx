import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Dimensions, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNWColorScheme } from "nativewind";
import { useRouter } from 'expo-router';
import { PageHeader } from '@/components/ui/PageHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Circle, LongPressEvent } from 'react-native-maps';
import { darkMapStyle } from '@/constants/MapStyles';
import { authApis, endpoints } from '@/configs/Apis';
import { BlurView } from 'expo-blur';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
const { width } = Dimensions.get('window');
const LONG_PRESS_COOLDOWN_MS = 1200;

interface PrivacyZone {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
    isActive: boolean;
}

export default function PrivacyZonesScreen() {
    const { colorScheme } = useNWColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const lastLongPressAtRef = useRef(0);
    const inFlightZoneOpsRef = useRef<Set<number>>(new Set());
    
    const [zones, setZones] = useState<PrivacyZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingZone, setAddingZone] = useState(false);
    const [newZonePos, setNewZonePos] = useState<{ latitude: number, longitude: number } | null>(null);
    const [busyZoneIds, setBusyZoneIds] = useState<number[]>([]);

    const beginZoneOperation = (zoneId: number) => {
        if (inFlightZoneOpsRef.current.has(zoneId)) return false;
        inFlightZoneOpsRef.current.add(zoneId);
        setBusyZoneIds((prev) => prev.includes(zoneId) ? prev : [...prev, zoneId]);
        return true;
    };

    const endZoneOperation = (zoneId: number) => {
        inFlightZoneOpsRef.current.delete(zoneId);
        setBusyZoneIds((prev) => prev.filter((id) => id !== zoneId));
    };

    const loadZones = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const res = await authApis(token).get(endpoints.privacyZones);
                setZones(res.data.data);
            }
        } catch (error) {
            console.error("Load privacy zones error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadZones();
    }, []);

    const handleLongPress = (e: LongPressEvent) => {
        const now = Date.now();
        if (addingZone || now - lastLongPressAtRef.current < LONG_PRESS_COOLDOWN_MS) {
            return;
        }
        lastLongPressAtRef.current = now;

        const { latitude, longitude } = e.nativeEvent.coordinate;
        setNewZonePos({ latitude, longitude });
        Alert.alert(
            "Thêm vùng an toàn",
            "Bạn muốn thiết lập vùng an toàn tại vị trí này?",
            [
                { text: "Hủy", onPress: () => setNewZonePos(null), style: "cancel" },
                { 
                    text: "Đồng ý", 
                    onPress: () => createZone(latitude, longitude)
                }
            ]
        );
    };

    const createZone = async (lat: number, lng: number) => {
        if (addingZone) return;
        setAddingZone(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                await authApis(token).post(endpoints.privacyZones, {
                    name: `Vùng an toàn ${zones.length + 1}`,
                    latitude: lat,
                    longitude: lng,
                    radius: 200
                });
                loadZones();
                setNewZonePos(null);
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tạo vùng an toàn.");
        } finally {
            setAddingZone(false);
        }
    };

    const toggleZone = async (id: number, currentStatus: boolean) => {
        if (!beginZoneOperation(id)) return;

        setZones((prev) => prev.map((z) => z.id === id ? { ...z, isActive: !currentStatus } : z));

        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                await authApis(token).patch(endpoints.privacyZoneToggle(id), {
                    isActive: !currentStatus
                });
            } else {
                throw new Error('No auth token');
            }
        } catch (error) {
            setZones((prev) => prev.map((z) => z.id === id ? { ...z, isActive: currentStatus } : z));
            Alert.alert("Lỗi", "Không thể thay đổi trạng thái.");
        } finally {
            endZoneOperation(id);
        }
    };

    const deleteZone = async (id: number) => {
        Alert.alert(
            "Xóa vùng an toàn",
            "Bạn chắc chắn muốn xóa vùng này? Tọa độ các VoicePin trong vùng này sẽ hiển thị chính xác cho người khác.",
            [
                { text: "Hủy", style: "cancel" },
                { 
                    text: "Xóa", 
                    style: "destructive",
                    onPress: async () => {
                        if (!beginZoneOperation(id)) return;
                        try {
                            const token = await AsyncStorage.getItem('token');
                            if (token) {
                                setZones((prev) => prev.filter((z) => z.id !== id));
                                await authApis(token).delete(endpoints.privacyZoneDelete(id));
                            } else {
                                throw new Error('No auth token');
                            }
                        } catch (error) {
                            Alert.alert("Lỗi", "Không thể xóa vùng an toàn.");
                            loadZones();
                        } finally {
                            endZoneOperation(id);
                        }
                    }
                }
            ]
        );
    };

    const focusOnZone = (lat: number, lng: number) => {
        mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
        }, 1000);
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <PageHeader title="Vùng an toàn" subtitle="Bảo vệ vị trí riêng tư của bạn" />

            <View className="h-[350px] w-full bg-gray-200 dark:bg-gray-800 relative">
                <MapView
                    ref={mapRef}
                    style={{ flex: 1 }}
                    initialRegion={{
                        latitude: zones[0]?.latitude || 10.7769,
                        longitude: zones[0]?.longitude || 106.7009,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    }}
                    onLongPress={handleLongPress}
                    customMapStyle={isDark ? darkMapStyle : []}
                >
                    {zones.map(zone => (
                        <React.Fragment key={zone.id}>
                            <Marker
                                coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
                                title={zone.name}
                            >
                                <View className={`w-8 h-8 rounded-full items-center justify-center ${zone.isActive ? 'bg-primary-500' : 'bg-gray-400'}`}>
                                    <Ionicons name="shield-checkmark" size={16} color="#fff" />
                                </View>
                            </Marker>
                            <Circle
                                center={{ latitude: zone.latitude, longitude: zone.longitude }}
                                radius={zone.radius}
                                fillColor={zone.isActive ? "rgba(126, 160, 0, 0.2)" : "rgba(156, 163, 175, 0.2)"}
                                strokeColor={zone.isActive ? "#7ea000" : "#9ca3af"}
                                strokeWidth={2}
                            />
                        </React.Fragment>
                    ))}
                    {newZonePos && (
                        <Marker coordinate={newZonePos}>
                            <View className="w-8 h-8 rounded-full bg-blue-500 items-center justify-center">
                                <ActivityIndicator size="small" color="#fff" />
                            </View>
                        </Marker>
                    )}
                </MapView>
                
                <View className="absolute bottom-4 left-4 right-4">
                    <BlurView intensity={30} tint={isDark ? "dark" : "light"} style={{ borderRadius: 16, overflow: 'hidden' }}>
                        <View className="p-4 bg-white/60 dark:bg-gray-900/60 flex-row items-center">
                            <Ionicons name="information-circle" size={20} color="#7ea000" />
                            <Text style={{ marginLeft: 8, fontSize: 13, color: isDark ? '#f3f4f6' : '#374151', flex: 1 }}>
                                Nhấn giữ trên bản đồ để thiết lập vùng an toàn mới (Nhà, Cơ quan...).
                            </Text>
                        </View>
                    </BlurView>
                </View>
            </View>

            <ScrollView className="flex-1 p-4">
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#9ca3af' : '#6b7280', marginBottom: 12, marginLeft: 4 }}>
                    DANH SÁCH VÙNG AN TOÀN ({zones.length})
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#7ea000" style={{ marginTop: 40 }} />
                ) : zones.length === 0 ? (
                    <View className="items-center justify-center py-10">
                        <Ionicons name="shield-outline" size={64} color={isDark ? '#374151' : '#e5e7eb'} />
                        <Text className="mt-4 text-gray-500 text-center">
                            Bạn chưa thiết lập vùng an toàn nào.{"\n"}Vị trí các VoicePin của bạn đang hiển thị chính xác.
                        </Text>
                    </View>
                ) : (
                    zones.map((zone) => (
                        <MotiView
                            key={zone.id}
                            from={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 300 }}
                            style={styles.itemWrapper}
                        >
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => focusOnZone(zone.latitude, zone.longitude)}
                                style={[
                                    styles.itemContainer,
                                    {
                                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)'
                                    }
                                ]}
                            >
                                <View style={styles.leftCol}>
                                    <View style={styles.avatarContainer}>
                                        <LinearGradient 
                                            colors={zone.isActive ? ['#84cc16', '#4d7c0f'] : ['#9ca3af', '#4b5563']} 
                                            style={styles.avatarPlaceholder}
                                        >
                                            <Ionicons name={zone.isActive ? "shield-checkmark" : "shield-half"} size={22} color="#fff" />
                                        </LinearGradient>
                                        
                                        <View style={[styles.miniTypeIcon, { backgroundColor: zone.isActive ? '#65a30d' : '#4b5563', borderColor: isDark ? '#1e1e2e' : '#fff' }]}>
                                            <Ionicons name="location" size={10} color="#fff" />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.rightCol}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <View style={{ flex: 1, gap: 2 }}>
                                            <View style={styles.itemMeta}>
                                                <Text style={[styles.notifTypeLabel, { color: zone.isActive ? '#65a30d' : '#6b7280' }]}>
                                                    {zone.isActive ? 'ĐANG KÍCH HOẠT' : 'ĐÃ TẮT'}
                                                </Text>
                                            </View>

                                            <View>
                                                <Text numberOfLines={1} style={[styles.messageText, { color: isDark ? '#fff' : '#111827', fontWeight: '800' }]}>
                                                    {zone.name}
                                                </Text>
                                                <Text style={[styles.messageText, { color: isDark ? '#9ca3af' : '#4b5563', fontStyle: 'italic', fontSize: 12, marginTop: 1 }]}>
                                                    Bán kính: {zone.radius}m
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={[styles.actionRow, { marginTop: 0, flexDirection: 'column', gap: 6 }]}>
                                            <TouchableOpacity
                                                style={[styles.actionButton, { backgroundColor: zone.isActive ? '#fbbf24' : '#10b981', minWidth: 60 }]}
                                                onPress={() => toggleZone(zone.id, zone.isActive)}
                                                disabled={busyZoneIds.includes(zone.id)}
                                            >
                                                {busyZoneIds.includes(zone.id) ? (
                                                    <ActivityIndicator size="small" color={isDark ? '#000' : '#fff'} />
                                                ) : (
                                                    <>
                                                        <Ionicons name={zone.isActive ? "eye-off" : "eye"} size={14} color={isDark ? '#000' : '#fff'} style={{ marginRight: 4 }} />
                                                        <Text style={[styles.actionButtonText, { color: isDark ? '#000' : '#fff' }]}>{zone.isActive ? 'Tắt' : 'Bật'}</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.secondaryAction, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', minWidth: 60 }]}
                                                onPress={() => deleteZone(zone.id)}
                                                disabled={busyZoneIds.includes(zone.id)}
                                            >
                                                {busyZoneIds.includes(zone.id) ? (
                                                    <ActivityIndicator size="small" color={isDark ? '#9ca3af' : '#6b7280'} />
                                                ) : (
                                                    <>
                                                        <Ionicons name="trash-outline" size={14} color={isDark ? '#9ca3af' : '#6b7280'} style={{ marginRight: 4 }} />
                                                        <Text style={[styles.actionButtonText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Xóa</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </MotiView>
                    ))
                )}
                <View className="h-20" />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    itemWrapper: {
        borderRadius: 28,
        overflow: 'hidden',
        marginBottom: 12,
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 18,
        gap: 15,
        borderWidth: 1.2,
        borderRadius: 28,
    },
    leftCol: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 54,
        height: 54,
        position: 'relative',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniTypeIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    rightCol: { flex: 1, gap: 4 },
    itemMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    notifTypeLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    messageText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryAction: {
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    actionButtonText: { fontSize: 12, fontWeight: '800' },
});
