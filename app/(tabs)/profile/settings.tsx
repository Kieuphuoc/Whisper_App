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
    TouchableOpacity,
    View,
    useColorScheme,
    Switch,
} from 'react-native';
import { Text } from '@/components/ui/text';
import Mapbox from '@/configs/Mapbox';
import { darkMapStyle } from '@/constants/MapStyles';
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';


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
                <Text style={{ fontSize: 17, fontWeight: '600', color: textColor || (colorScheme === 'dark' ? '#f3f4f6' : '#1f2937') }}>{label}</Text>
            </View>
            <View className="flex-row items-center">
                {!!value && <Text style={{ color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 14 }}>{value}</Text>}
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
    const [mapType, setMapType] = useState('dark');
    const [notifications, setNotifications] = useState(true);
    const [activityStatus, setActivityStatus] = useState(true);
    const [publicProfile, setPublicProfile] = useState(true);
    const [locationSharing, setLocationSharing] = useState('Bạn bè');

    useEffect(() => {
        const loadSettings = async () => {
            const savedMapType = await AsyncStorage.getItem('mapType');
            if (savedMapType) {
                if (savedMapType === 'standard') setMapType('dark');
                else if (savedMapType === 'terrain') setMapType('light');
                else setMapType(savedMapType);
            }
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
                    <Mapbox.MapView
                        key={mapType}
                        style={StyleSheet.absoluteFill}
                        styleURL={mapType === 'satellite' ? Mapbox.StyleURL.Satellite : (mapType === 'dark' ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light)}
                        logoEnabled={false}
                        attributionEnabled={false}
                    >
                        <Mapbox.Camera
                            centerCoordinate={[FALLBACK_LNG, FALLBACK_LAT]}
                            zoomLevel={12}
                        />
                        <Mapbox.MarkerView
                            id="preview-marker"
                            coordinate={[FALLBACK_LNG, FALLBACK_LAT]}
                        >
                            <View className="w-8 h-8 rounded-full bg-primary-500 border-2 border-white items-center justify-center">
                                <Ionicons name="mic" size={16} color="white" />
                            </View>
                        </Mapbox.MarkerView>
                    </Mapbox.MapView>

                    {/* Animated Overlay for selection change feedback */}
                    <View className="absolute inset-0 bg-black/5 pointer-events-none" />

                    {/* Map Type Controls */}
                    <View className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-gray-900/95 p-1.5 rounded-2xl flex-row shadow-lg">
                        {['dark', 'light', 'satellite'].map((type) => {
                            const labels: Record<string, string> = { dark: 'Tối', light: 'Sáng', satellite: 'Vệ tinh' };
                            const isActive = mapType === type;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => handleMapTypeChange(type)}
                                    className={`flex-1 py-3.5 rounded-xl items-center justify-center ${isActive ? 'bg-gray-900 dark:bg-white' : ''}`}
                                >
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: isActive ? (colorScheme === 'dark' ? '#000' : '#fff') : '#6b7280' }}>
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

            <SettingTabHeader title="Cài đặt" leftIcon="close" />

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                {/* Profile Section */}
                <TouchableOpacity
                    className="flex-row items-center p-4 mb-8 bg-gray-50 dark:bg-gray-900 rounded-2xl"
                    onPress={() => router.push('/(tabs)/profile/edit-profile')}
                >
                    <Image source={{ uri: avatarUri }} className="w-16 h-16 rounded-full mr-4" />
                    <View className="flex-1">
                        <Text style={{ fontSize: 18, fontWeight: '700', color: colorScheme === 'dark' ? '#fff' : '#111' }}>{displayName}</Text>
                        <Text style={{ color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 14 }}>Chỉnh sửa hồ sơ</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>

                {/* Account Section */}
                <View className="mb-6">
                    <Text style={{ fontWeight: '700', fontSize: 12, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: 8, marginLeft: 4 }}>TÀI KHOẢN</Text>
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        <SettingItem icon="person-outline" label="Thông tin cá nhân" onPress={() => router.push('/(tabs)/profile/edit-profile')} />
                        <SettingItem icon="time-outline" label="Lịch sử nghe" onPress={() => router.push('/(tabs)/profile/history')} />
                    </View>
                </View>

                {/* Preferences Section - Toggles are grouped here */}
                <View className="mb-6">
                    <Text style={{ fontWeight: '700', fontSize: 12, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: 8, marginLeft: 4 }}>TÙY CHỈNH & HIỂN THỊ</Text>
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        <SettingItem icon="notifications-outline" label="Push Notifications" showArrow={false}>
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: '#e2e8f0', true: '#1e293b' }}
                                thumbColor="#fff"
                            />
                        </SettingItem>
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
                                <Text style={{ fontSize: 17, fontWeight: '600', color: colorScheme === 'dark' ? '#fff' : '#111' }}>Loại bản đồ</Text>
                            </View>
                            {renderMapTypePicker()}
                        </View>
                    </View>
                </View>

                {/* Privacy Section */}
                <View className="mb-6">
                    <Text style={{ fontWeight: '700', fontSize: 12, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: 8, marginLeft: 4 }}>QUYỀN RIÊNG TƯ</Text>
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        <SettingItem 
                            icon="lock-closed-outline" 
                            label="Kiểm tra quyền riêng tư" 
                            onPress={() => router.push('/(tabs)/profile/privacy-checkup')}
                        />
                    </View>
                </View>

                {/* Support Section */}
                <View className="mb-6">
                    <Text style={{ fontWeight: '700', fontSize: 12, color: colorScheme === 'dark' ? '#9ca3af' : '#6b7280', marginBottom: 8, marginLeft: 4 }}>HỖ TRỢ & THÔNG TIN</Text>
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                        <SettingItem 
                            icon="refresh-outline" 
                            label="Xem lại hướng dẫn" 
                            onPress={async () => {
                                await AsyncStorage.removeItem('onboarding_completed');
                                await AsyncStorage.removeItem('walkthrough_completed');
                                Alert.alert('Thành công', 'Hướng dẫn đã được đặt lại. Bạn sẽ thấy chúng ở lần khởi động tới trên Whispery.');
                            }} 
                        />
                        <SettingItem 
                            icon="help-circle-outline" 
                            label="Hỗ trợ & Phản hồi" 
                            onPress={() => router.push('/(tabs)/profile/support')}
                        />
                        <SettingItem 
                            icon="information-circle-outline" 
                            label="Về chúng tôi" 
                            onPress={() => router.push('/(tabs)/profile/about')}
                        />
                    </View>
                </View>

                {/* Danger Zone */}
                <View className="mb-6 mt-2">
                    <View className="bg-white dark:bg-gray-950 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
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
                    <Text style={{ color: '#9ca3af', fontSize: 14 }}>Whispery v1.0.0</Text>
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