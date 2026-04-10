import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { MyDispatchContext, MyUserContext } from '@/configs/Context';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useColorScheme } from "nativewind";
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
} from 'react-native';
import { Text } from '@/components/ui/text';

// Giữ nguyên các component import
import { SettingTabHeader } from '@/components/profile/SettingTabHeader';
import { SettingInput } from '@/components/profile/SettingInput';

export default function EditProfileScreen() {
    const { colorScheme } = useColorScheme();
    const user = useContext(MyUserContext) as User | null;
    const dispatch = useContext(MyDispatchContext);
    const router = useRouter();

    // States
    const [displayName, setDisplayName] = useState(user?.displayName || '');
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
        return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
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
        if (!trimmedName) {
            Alert.alert('Thông báo', 'Tên hiển thị không được để trống');
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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-white dark:bg-gray-950"
        >
            <SettingTabHeader
                title="Chỉnh sửa hồ sơ"
                leftIcon="arrow-back"
                rightElement={
                    <TouchableOpacity
                        onPress={handleUpdate}
                        disabled={loading}
                        className="px-2"
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#3cd3bf" />
                        ) : (
                            <Text className="text-[#3cd3bf] font-bold text-lg">Lưu</Text>
                        )}
                    </TouchableOpacity>
                }
            />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Avatar Section */}
                <View className="items-center py-8">
                    <TouchableOpacity
                        onPress={pickImage}
                        activeOpacity={0.9}
                        className="relative group"
                    >
                        <View className="p-1 rounded-2xl border-2 border-primary-500/20">
                            <Image
                                source={{ uri: avatarUri }}
                                className="w-32 h-32 rounded-xl bg-gray-200"
                            />
                        </View>
                        <View className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary-500 items-center justify-center border-4 border-white dark:border-gray-950 shadow-sm">
                            <Ionicons name="camera" size={18} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text className="mt-3 text-gray-400 text-sm font-medium">Nhấn để đổi ảnh</Text>
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

                    {/* Read-only Information */}
                    <View className="opacity-70">
                        <SettingInput
                            label="Tên đăng nhập"
                            value={user?.username || 'user'}
                            editable={false}
                            leftElement={<Text className="text-primary-500 font-bold mr-1 text-lg">@</Text>}
                        />
                    </View>

                    <View className="opacity-70">
                        <SettingInput
                            label="Địa chỉ Email"
                            value={user?.email || 'Chưa cập nhật'}
                            editable={false}
                            leftElement={<Ionicons name="mail-outline" size={20} color="#94a3b8" className="mr-2" />}
                        />
                    </View>
                </View>

                {/* Bottom Action */}
                <View className="px-5 mt-10">
                    <TouchableOpacity
                        className={`py-4 rounded-2xl items-center shadow-lg shadow-primary-500/30 ${loading ? 'bg-primary-300' : 'bg-primary-500'}`}
                        onPress={handleUpdate}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white text-lg font-bold">Cập nhật ngay</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}