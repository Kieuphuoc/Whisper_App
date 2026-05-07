import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { MyDispatchContext, MyUserContext } from '@/configs/Context';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useContext, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    View,
    useColorScheme,
    StyleSheet,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { theme } from '@/constants/Theme';
import { BubbleBackground } from '@/components/ui/BubbleBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Giữ nguyên các component import
import { PageHeader } from '@/components/ui/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { SettingInput } from '@/components/profile/SettingInput';

export default function EditProfileScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];
    const user = useContext(MyUserContext) as User | null;
    const dispatch = useContext(MyDispatchContext);
    const router = useRouter();

    // States
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [loading, setLoading] = useState(false);

    // Xử lý logic hiển thị Avatar memoized để tránh re-render thừa
    const avatarUri = useMemo(() => {
        if (avatar) return avatar.uri;
        if (user?.avatar) {
            return user.avatar.startsWith('http')
                ? user.avatar
                : `${BASE_URL}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`;
        }
        return null;
    }, [avatar, user?.avatar]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Quyền truy cập', 'Chúng tôi cần quyền truy cập thư viện ảnh để thay đổi avatar.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7, // Giảm nhẹ chất lượng để upload nhanh hơn
        });

        if (!result.canceled) {
            setAvatar(result.assets[0]);
        }
    };

    const handleUpdate = async () => {
        const trimmedName = displayName.trim();
        const trimmedUsername = username.trim().toLowerCase();

        if (!trimmedName) {
            Alert.alert('Thông báo', 'Tên hiển thị không được để trống');
            return;
        }

        if (trimmedUsername.length < 3) {
            Alert.alert('Thông báo', 'Tên đăng nhập phải có ít nhất 3 ký tự');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) throw new Error('No token found');
            const api = authApis(token);

            // 1. Cập nhật thông tin cơ bản
            await api.put(endpoints.userMe, {
                displayName: trimmedName,
                username: trimmedUsername,
                bio: bio.trim(),
            });

            // 2. Cập nhật Avatar nếu có thay đổi
            let updatedUser;
            if (avatar) {
                const formData = new FormData();
                const filename = avatar.uri.split('/').pop() || 'avatar.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                // @ts-ignore
                formData.append('avatar', {
                    uri: avatar.uri,
                    name: filename,
                    type,
                });

                const resAvatar = await api.put(endpoints.userAvatar, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                updatedUser = resAvatar.data?.data ?? resAvatar.data;
            } else {
                const resMe = await api.get(endpoints.userMe);
                updatedUser = resMe.data?.data ?? resMe.data;
            }

            // 3. Đồng bộ hóa Context và Storage
            if (dispatch && updatedUser) {
                dispatch({ type: 'SET_USER', payload: updatedUser });
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }

            Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            console.error('Update error:', e);
            Alert.alert('Lỗi', e.response?.data?.message || 'Không thể kết nối đến máy chủ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={isDark ? ['#1e1b4b', '#000'] : ['#f5f3ff', '#fff']}
                    style={StyleSheet.absoluteFill}
                />
                <BubbleBackground />
            </View>

            <PageHeader
                title="Sửa hồ sơ"
                subtitle="Cập nhật thông tin của bạn"
                rightIcon="checkmark-done"
                onRightPress={handleUpdate}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <Avatar
                            uri={avatarUri}
                            size={130}
                            showLevel
                            level={user?.level || 1}
                            showCamera
                            onPress={pickImage}
                        />
                        <Text style={[styles.avatarHint, { color: isDark ? '#9ca3af' : '#6b7280' }]}>Nhấn để đổi ảnh đại diện</Text>
                    </View>

                    {/* Form Section */}
                    <View className="px-5 gap-y-6">
                        <SettingInput
                            label="Tên hiển thị"
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Tên của bạn"
                            autoCapitalize="words"
                        />

                        <SettingInput
                            label="Tên đăng nhập (ID)"
                            value={username}
                            onChangeText={setUsername}
                            placeholder="username"
                            autoCapitalize="none"
                            leftElement={<Text className="text-primary-500 font-bold mr-1 text-lg">@</Text>}
                        />

                        <SettingInput
                            label="Tiểu sử"
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Viết gì đó về bạn..."
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{ height: 100, paddingTop: 12 }}
                        />

                        <View className="h-[1px] bg-gray-100 dark:bg-gray-900 mx-2 my-2" />

                        <View className="px-2 pb-10">
                            <Text style={[styles.infoNote, { color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af' }]}>
                                Tên đăng nhập (ID) là duy nhất và không thể trùng lặp.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    avatarHint: {
        marginTop: 15,
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.8,
    },
    infoNote: {
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});