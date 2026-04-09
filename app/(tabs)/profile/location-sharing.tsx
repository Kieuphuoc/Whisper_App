import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar, Switch } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme as useNWColorScheme } from "nativewind";
import { useRouter } from 'expo-router';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Mapbox from '@/configs/Mapbox';
import { darkMapStyle } from '@/constants/MapStyles';
import { authApis, endpoints } from '@/configs/Apis';

export default function LocationSharingScreen() {
    const { colorScheme } = useNWColorScheme();
    const router = useRouter();
    
    const [liveLocation, setLiveLocation] = useState(false);
    const [sharingLevel, setSharingLevel] = useState('FRIENDS'); // EVERYONE, FRIENDS, NONE
    const [mapType, setMapType] = useState('dark');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                const token = await AsyncStorage.getItem('token');
                const savedMap = await AsyncStorage.getItem('mapType');
                if (savedMap) setMapType(savedMap === 'standard' ? 'dark' : (savedMap === 'terrain' ? 'light' : savedMap));
                
                if (token) {
                    const res = await authApis(token).get(endpoints.userMe);
                    const userData = res.data.data;
                    setLiveLocation(userData.liveLocation);
                    setSharingLevel(userData.sharingLevel);
                }
            } catch (error) {
                console.error("Load sharing settings error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const saveLive = async (val: boolean) => {
        setLiveLocation(val);
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                await authApis(token).put(endpoints.userMe, { liveLocation: val });
            }
        } catch (error) {
            console.error("Save live error:", error);
        }
    };

    const saveLevel = async (level: string) => {
        setSharingLevel(level);
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                await authApis(token).put(endpoints.userMe, { sharingLevel: level });
            }
        } catch (error) {
            console.error("Save level error:", error);
        }
    };

    // Dummy coordinate
    const FALLBACK_LAT = 10.7769;
    const FALLBACK_LNG = 106.7009;

    return (
        <View className="flex-1 bg-gray-50 dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
            <SettingTabHeader title="Chia sẻ vị trí" leftIcon="chevron-back" />

            <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
                {/* Map Preview */}
                <View className="h-[250px] w-full bg-gray-200 dark:bg-gray-800 relative shadow-sm">
                    <Mapbox.MapView
                        style={{ flex: 1 }}
                        styleURL={mapType === 'dark' ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light}
                        logoEnabled={false}
                        attributionEnabled={false}
                    >
                        <Mapbox.Camera
                            centerCoordinate={[FALLBACK_LNG, FALLBACK_LAT]}
                            zoomLevel={12}
                        />
                        <Mapbox.PointAnnotation
                            id="sharing-marker"
                            coordinate={[FALLBACK_LNG, FALLBACK_LAT]}
                        >
                            <View className="w-10 h-10 rounded-full bg-primary-500/20 items-center justify-center">
                                <View className="w-5 h-5 rounded-full bg-primary-500 border-2 border-white" />
                            </View>
                        </Mapbox.PointAnnotation>
                    </Mapbox.MapView>
                    <View className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-900/90 py-3 px-4 rounded-xl flex-row items-center shadow-lg backdrop-blur-md">
                        <Ionicons name="information-circle" size={20} color="#7ea000" />
                        <Text style={{ marginLeft: 8, fontSize: 13, color: colorScheme === 'dark' ? '#f3f4f6' : '#374151', flex: 1 }}>
                            Đây là vị trí mô phỏng. Khi bạn tạo VoicePin mới, vị trí thực tế sẽ được dùng.
                        </Text>
                    </View>
                </View>

                {/* Settings list */}
                <View className="p-4 mt-2">
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: 12, marginLeft: 4 }}>
                        CHIA SẺ CHO AI?
                    </Text>

                    <View className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 mb-6">
                        <TouchableOpacity 
                            className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800"
                            onPress={() => saveLevel('EVERYONE')}
                        >
                            <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-4">
                                <Ionicons name="earth" size={20} color="#3b82f6" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ fontSize: 16, fontWeight: '600', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Mọi người</Text>
                                <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }}>Ai cũng xem được vị trí ở mỗi bài đăng.</Text>
                            </View>
                            <Ionicons name={sharingLevel === 'EVERYONE' ? 'radio-button-on' : 'radio-button-off'} size={24} color={sharingLevel === 'EVERYONE' ? '#7ea000' : '#9ca3af'} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800"
                            onPress={() => saveLevel('FRIENDS')}
                        >
                            <View className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 items-center justify-center mr-4">
                                <Ionicons name="people" size={20} color="#f97316" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ fontSize: 16, fontWeight: '600', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Chỉ bạn bè</Text>
                                <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }}>Người lạ sẽ chỉ thấy được bán kính ước chừng.</Text>
                            </View>
                            <Ionicons name={sharingLevel === 'FRIENDS' ? 'radio-button-on' : 'radio-button-off'} size={24} color={sharingLevel === 'FRIENDS' ? '#7ea000' : '#9ca3af'} />
                        </TouchableOpacity>

                        <TouchableOpacity 
                            className="flex-row items-center p-4"
                            onPress={() => saveLevel('NONE')}
                        >
                            <View className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 items-center justify-center mr-4">
                                <Ionicons name="lock-closed" size={20} color="#6b7280" />
                            </View>
                            <View className="flex-1">
                                <Text style={{ fontSize: 16, fontWeight: '600', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Chỉ mình tôi</Text>
                                <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280' }}>Vị trí hoàn toàn riêng tư đối với tất cả bài đăng.</Text>
                            </View>
                            <Ionicons name={sharingLevel === 'NONE' ? 'radio-button-on' : 'radio-button-off'} size={24} color={sharingLevel === 'NONE' ? '#7ea000' : '#9ca3af'} />
                        </TouchableOpacity>
                    </View>

                    <Text style={{ fontSize: 14, fontWeight: '700', color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: 12, marginLeft: 4 }}>
                        VỊ TRÍ TRỰC TIẾP
                    </Text>

                    <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex-row items-center justify-between">
                        <View className="flex-1 mr-4">
                            <Text style={{ fontSize: 16, fontWeight: '600', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Chia sẻ vị trí nền</Text>
                            <Text style={{ fontSize: 13, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginTop: 4 }}>
                                Cho phép bạn bè biết bạn đang ở gần ngay cả khi không có bài đăng mới.
                            </Text>
                        </View>
                        <Switch
                            value={liveLocation}
                            onValueChange={saveLive}
                            trackColor={{ false: '#e2e8f0', true: '#7ea000' }}
                            thumbColor="#fff"
                        />
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}
