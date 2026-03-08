import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { MyDispatchContext, MyUserContext } from '@/configs/Context';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useColorScheme as useNWColorScheme } from "nativewind";
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
    useSharedValue,
    interpolateColor,
    withDelay
} from 'react-native-reanimated';

interface SettingItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress?: () => void;
    value?: string;
    showArrow?: boolean;
    textColor?: string;
    children?: React.ReactNode;
}

const SettingItem = ({
    icon,
    label,
    onPress,
    value,
    showArrow = true,
    textColor,
    children
}: SettingItemProps) => {
    const { colorScheme } = useNWColorScheme();

    return (
        <TouchableOpacity
            className="flex-row items-center justify-between py-4 px-1 border-b border-gray-100 dark:border-gray-800"
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl items-center justify-center mr-4 bg-gray-100 dark:bg-gray-800">
                    <Ionicons
                        name={icon}
                        size={20}
                        color={textColor === '#ef4444' ? '#ef4444' : (colorScheme === 'dark' ? '#f3f4f6' : '#374151')}
                    />
                </View>
                <Text className={`text-[17px] font-semibold ${textColor ? '' : 'text-gray-900 dark:text-gray-100'}`} style={textColor ? { color: textColor } : {}}>{label}</Text>
            </View>
            <View className="flex-row items-center">
                {value && <Text className="text-gray-500 dark:text-gray-400 text-sm mr-2">{value}</Text>}
                {children}
                {showArrow && !children && <Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
            </View>
        </TouchableOpacity>
    );
};

export default function SettingsScreen() {
    const { colorScheme, setColorScheme } = useNWColorScheme();
    const systemColorScheme = useColorScheme();
    const user = useContext(MyUserContext) as User | null;
    const dispatch = useContext(MyDispatchContext);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [mapType, setMapType] = useState('standard');

    useEffect(() => {
        const loadSettings = async () => {
            const savedMapType = await AsyncStorage.getItem('mapType');
            if (savedMapType) setMapType(savedMapType);
        };
        loadSettings();
    }, []);

    const handleMapTypeChange = async (type: string) => {
        setMapType(type);
        await AsyncStorage.setItem('mapType', type);
    };

    const logout = async () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        await AsyncStorage.removeItem('token');
                        await AsyncStorage.removeItem('user');
                        if (dispatch) dispatch({ type: 'LOGOUT' });
                        router.replace('/login');
                    } catch (e) {
                        console.error('Logout error:', e);
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const getAvatarUri = (avatar?: string) => {
        if (!avatar) return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
        if (avatar.startsWith('http')) return avatar;
        return `${BASE_URL}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
    };

    const avatarUri = getAvatarUri(user?.avatar);
    const displayName = user?.displayName || user?.username || 'Người dùng';

    const renderThemeToggle = () => {
        const switchWidth = 56;
        const thumbSize = 24;
        const translateX = useSharedValue(colorScheme === 'dark' ? switchWidth - thumbSize - 8 : 0);
        const thumbScaleX = useSharedValue(1);

        useEffect(() => {
            translateX.value = withSpring(colorScheme === 'dark' ? switchWidth - thumbSize - 8 : 0, {
                damping: 15,
                stiffness: 150
            });

            // Liquid "Drop" effect: stretch thumb when moving
            thumbScaleX.value = withTiming(1.3, { duration: 100 }, () => {
                thumbScaleX.value = withSpring(1);
            });
        }, [colorScheme]);

        const animatedThumbStyle = useAnimatedStyle(() => ({
            transform: [
                { translateX: translateX.value },
                { scaleX: thumbScaleX.value }
            ],
            backgroundColor: '#ffffff'
        }));

        return (
            <View className="flex-row items-center justify-between py-1">
                <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl items-center justify-center mr-4 bg-gray-100 dark:bg-gray-800">
                        <Ionicons
                            name={colorScheme === 'dark' ? "moon" : "sunny"}
                            size={20}
                            color={colorScheme === 'dark' ? '#f3f4f6' : '#374151'}
                        />
                    </View>
                    <Text className="text-[17px] font-semibold text-gray-900 dark:text-white">Giao diện tối</Text>
                </View>
                <TouchableOpacity
                    onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
                    activeOpacity={1}
                    style={{
                        width: switchWidth,
                        height: 32,
                        borderRadius: 16,
                        padding: 4,
                        backgroundColor: colorScheme === 'dark' ? '#3cd3bf' : '#e5e7eb',
                        justifyContent: 'center'
                    }}
                >
                    <Animated.View
                        style={[
                            {
                                width: thumbSize,
                                height: thumbSize,
                                borderRadius: thumbSize / 2,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2,
                            },
                            animatedThumbStyle
                        ]}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    const renderMapTypePicker = () => {
        const FALLBACK_LAT = 10.7769;
        const FALLBACK_LNG = 106.7009;

        return (
            <View className="mt-2 mb-4">
                <View className="relative h-48 rounded-3xl overflow-hidden bg-gray-200 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    {/* Native Map Preview */}
                    <MapView
                        style={StyleSheet.absoluteFill}
                        initialRegion={{
                            latitude: FALLBACK_LAT,
                            longitude: FALLBACK_LNG,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                        region={{
                            latitude: FALLBACK_LAT,
                            longitude: FALLBACK_LNG,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                        mapType={mapType as any}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                    >
                        <Marker
                            coordinate={{ latitude: FALLBACK_LAT, longitude: FALLBACK_LNG }}
                        >
                            <View className="w-8 h-8 rounded-full bg-primary-500 border-2 border-white items-center justify-center">
                                <Ionicons name="mic" size={16} color="white" />
                            </View>
                        </Marker>
                    </MapView>

                    {/* Animated Overlay for selection change feedback */}
                    <View className="absolute inset-0 bg-black/5 pointer-events-none" />

                    {/* Map Type Controls */}
                    <View className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-gray-900/95 p-1.5 rounded-2xl flex-row shadow-lg">
                        {['standard', 'terrain', 'satellite'].map((type) => {
                            const labels: Record<string, string> = { standard: 'Đường', terrain: 'Tự động', satellite: 'Bản đồ vệ tinh' };
                            const isActive = mapType === type;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => handleMapTypeChange(type)}
                                    className={`flex-1 py-3.5 rounded-xl items-center justify-center ${isActive ? 'bg-gray-900 dark:bg-white' : ''}`}
                                >
                                    <Text className={`text-[13px] font-bold ${isActive ? 'text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {labels[type]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-white dark:bg-gray-950">
            <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

            <View className="h-24 pt-12 flex-row items-center justify-between px-4">
                <TouchableOpacity onPress={() => router.back()} className="w-11 h-11 items-center justify-center">
                    <Ionicons name="close" size={28} color={colorScheme === 'dark' ? '#fff' : '#111'} />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt</Text>
                <View className="w-11" />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {/* Profile Section */}
                <TouchableOpacity
                    className="flex-row items-center p-4 mb-8 bg-gray-50 dark:bg-gray-900 rounded-2xl"
                    onPress={() => router.push('/(tabs)/profile/edit-profile')}
                >
                    <Image source={{ uri: avatarUri }} className="w-16 h-16 rounded-full mr-4" />
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900 dark:text-white">{displayName}</Text>
                        <Text className="text-gray-500 text-sm">Chỉnh sửa hồ sơ</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                {/* Account Section */}
                <View className="mb-6">
                    <Text className="font-bold uppercase tracking-widest text-[12px] mb-3 ml-1 text-gray-500">TÀI KHOẢN</Text>
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden">
                        <SettingItem icon="person-outline" label="Thông tin cá nhân" onPress={() => router.push('/(tabs)/profile/edit-profile')} />
                        <SettingItem icon="notifications-outline" label="Thông báo" />
                        <SettingItem icon="lock-closed-outline" label="Quyền riêng tư" />
                    </View>
                </View>

                {/* App Section */}
                <View className="mb-6">
                    <Text className="font-bold uppercase tracking-widest text-[12px] mb-3 ml-1 text-gray-500">ỨNG DỤNG</Text>
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden">
                        <View className="px-1 border-b border-gray-100 dark:border-gray-800 py-4">
                            {renderThemeToggle()}
                        </View>

                        <View className="px-1 border-b border-gray-100 dark:border-gray-800 py-4">
                            <View className="flex-row items-center mb-4">
                                <View className="w-9 h-9 rounded-xl items-center justify-center mr-4 bg-gray-100 dark:bg-gray-800">
                                    <Ionicons name="map-outline" size={20} color={colorScheme === 'dark' ? '#f3f4f6' : '#374151'} />
                                </View>
                                <Text className="text-[17px] font-semibold text-gray-900 dark:text-white">Loại bản đồ</Text>
                            </View>
                            {renderMapTypePicker()}
                        </View>

                        <SettingItem icon="language-outline" label="Ngôn ngữ" value="Tiếng Việt" />
                        <SettingItem icon="help-circle-outline" label="Hỗ trợ & Phản hồi" />
                        <SettingItem icon="information-circle-outline" label="Về chúng tôi" />
                    </View>
                </View>

                {/* Activity Section */}
                <View className="mb-6">
                    <Text className="font-bold uppercase tracking-widest text-[12px] mb-3 ml-1 text-gray-500">HOẠT ĐỘNG</Text>
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden shadow-sm">
                        <SettingItem 
                            icon="time-outline" 
                            label="Lịch sử xem" 
                            onPress={() => router.push('/(tabs)/profile/history')} 
                        />
                    </View>
                </View>

                {/* Privacy Section */}
                <View className="mb-6">
                    <Text className="font-bold uppercase tracking-widest text-[12px] mb-3 ml-1 text-gray-500">QUYỀN RIÊNG TƯ</Text>
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden">
                        <SettingItem icon="eye-outline" label="Trạng thái hoạt động" value="Bật" />
                        <SettingItem icon="location-outline" label="Chia sẻ vị trí" value="Bạn bè" />
                        <SettingItem icon="shield-checkmark-outline" label="Hồ sơ công khai" value="Bật" />
                    </View>
                </View>

                {/* Danger Zone */}
                <View className="mb-6 mt-2">
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden">
                        <SettingItem
                            icon="log-out-outline"
                            label="Đăng xuất"
                            onPress={logout}
                            showArrow={false}
                            textColor="#ef4444"
                        />
                    </View>
                </View>

                <View className="items-center mt-5 mb-10">
                    <Text className="text-gray-400 text-sm">Phiên bản 1.0.0</Text>
                </View>
            </ScrollView>

            {loading && (
                <View className="absolute inset-0 justify-center items-center bg-black/30 z-50">
                    <ActivityIndicator size="large" color="#7ea000" />
                </View>
            )}
        </View>
    );
}
