import { authApis, endpoints } from '@/configs/Apis';
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
    Switch,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

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
                {!!value && <Text className="text-gray-500 dark:text-gray-400 text-sm mr-2">{value}</Text>}
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
    const [notifications, setNotifications] = useState(true);

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
        return `http://10.5.1.149:5000${avatar.startsWith('/') ? '' : '/'}${avatar}`;
    };

    const avatarUri = getAvatarUri(user?.avatar);
    const displayName = user?.displayName || user?.username || 'Người dùng';

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
                        <SettingItem icon="notifications-outline" label="Push Notifications" showArrow={false}>
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: '#e2e8f0', true: '#1e293b' }}
                                thumbColor="#fff"
                            />
                        </SettingItem>
                        <SettingItem icon="lock-closed-outline" label="Quyền riêng tư" />
                    </View>
                </View>

                {/* App Section */}
                <View className="mb-6">
                    <Text className="font-bold uppercase tracking-widest text-[12px] mb-3 ml-1 text-gray-500">ỨNG DỤNG</Text>
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden">
                        <SettingItem
                            icon={colorScheme === 'dark' ? 'moon' : 'sunny'}
                            label="Giao diện tối"
                            showArrow={false}
                        >
                            <Switch
                                value={colorScheme === 'dark'}
                                onValueChange={(val) => setColorScheme(val ? 'dark' : 'light')}
                                trackColor={{ false: '#e2e8f0', true: '#1e293b' }}
                                thumbColor="#fff"
                            />
                        </SettingItem>

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