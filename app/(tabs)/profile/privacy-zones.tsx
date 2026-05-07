import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Dimensions } from 'react-native';
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

const { width } = Dimensions.get('window');

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
    
    const [zones, setZones] = useState<PrivacyZone[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingZone, setAddingZone] = useState(false);
    const [newZonePos, setNewZonePos] = useState<{ latitude: number, longitude: number } | null>(null);

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
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                await authApis(token).patch(endpoints.privacyZoneToggle(id), {
                    isActive: !currentStatus
                });
                setZones(zones.map(z => z.id === id ? { ...z, isActive: !currentStatus } : z));
            }
        } catch (error) {
            Alert.alert("Lỗi", "Không thể thay đổi trạng thái.");
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
                        try {
                            const token = await AsyncStorage.getItem('token');
                            if (token) {
                                await authApis(token).delete(endpoints.privacyZoneDelete(id));
                                setZones(zones.filter(z => z.id !== id));
                            }
                        } catch (error) {
                            Alert.alert("Lỗi", "Không thể xóa vùng an toàn.");
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
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            className="bg-white dark:bg-gray-900 p-4 rounded-2xl mb-4 border border-gray-100 dark:border-gray-800 flex-row items-center shadow-sm"
                        >
                            <TouchableOpacity 
                                className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${zone.isActive ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}
                                onPress={() => focusOnZone(zone.latitude, zone.longitude)}
                            >
                                <Ionicons name="location" size={24} color={zone.isActive ? "#7ea000" : "#9ca3af"} />
                            </TouchableOpacity>
                            
                            <View className="flex-1">
                                <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#fff' : '#111' }}>{zone.name}</Text>
                                <Text style={{ fontSize: 13, color: isDark ? '#9ca3af' : '#6b7280' }}>Bán kính bảo vệ: {zone.radius}m</Text>
                            </View>

                            <View className="flex-row items-center">
                                <TouchableOpacity 
                                    className="p-2 mr-2"
                                    onPress={() => toggleZone(zone.id, zone.isActive)}
                                >
                                    <Ionicons 
                                        name={zone.isActive ? "eye" : "eye-off"} 
                                        size={22} 
                                        color={zone.isActive ? "#7ea000" : "#9ca3af"} 
                                    />
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    className="p-2"
                                    onPress={() => deleteZone(zone.id)}
                                >
                                    <Ionicons name="trash-outline" size={22} color="#f43f5e" />
                                </TouchableOpacity>
                            </View>
                        </MotiView>
                    ))
                )}
                <View className="h-20" />
            </ScrollView>
        </View>
    );
}
