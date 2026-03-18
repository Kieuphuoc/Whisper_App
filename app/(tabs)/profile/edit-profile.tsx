import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { MyDispatchContext, MyUserContext } from '@/configs/Context';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useColorScheme } from "nativewind";
import React, { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Text } from '@/components/ui/text';

export default function EditProfileScreen() {
    const { colorScheme } = useColorScheme();
    const user = useContext(MyUserContext) as User | null;
    const dispatch = useContext(MyDispatchContext);
    const router = useRouter();

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatar, setAvatar] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0]);
        }
    };

    const handleUpdate = async () => {
        if (!displayName.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên hiển thị');
            return;
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);

            const formData = new FormData();
            formData.append('displayName', displayName);
            formData.append('bio', bio);

            if (avatar) {
                const localUri = avatar.uri;
                const filename = localUri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename || '');
                const type = match ? `image/${match[1]}` : `image`;
                formData.append('avatar', { uri: localUri, name: filename, type } as any);
            }

            const res = await api.patch(endpoints.userMe, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.status === 200) {
                // Update context
                const updatedUser = res.data?.data ?? res.data;
                if (dispatch) {
                    dispatch({ type: 'SET_USER', payload: updatedUser });
                }
                Alert.alert('Thành công', 'Hồ sơ đã được cập nhật');
                router.back();
            }
        } catch (e) {
            console.error('Update profile error:', e);
            Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const avatarUri = avatar?.uri ||
        (user?.avatar?.startsWith('http') ? user.avatar : `${BASE_URL}${user?.avatar?.startsWith('/') ? '' : '/'}${user?.avatar}`) ||
        'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white dark:bg-gray-950"
        >
            <View className="h-24 pt-12 flex-row items-center justify-between px-5 border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 justify-center">
                    <Ionicons name="arrow-back" size={24} color={colorScheme === 'dark' ? '#fff' : '#111'} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900 dark:text-white">Chỉnh sửa hồ sơ</Text>
                <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#3cd3bf" />
                    ) : (
                        <Text className="text-base font-bold text-primary-500">Lưu</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 25 }}>
                <View className="items-center mb-10">
                    <TouchableOpacity onPress={pickImage} className="relative">
                        <Image source={{ uri: avatarUri }} className="w-32 h-32 rounded-full border-4 border-primary-500" />
                        <View className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary-500 items-center justify-center border-2 border-white dark:border-gray-950">
                            <Ionicons name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                </View>

                <View className="gap-5 mb-10">
                    <View className="gap-2">
                        <Text className="text-xs font-bold text-gray-500 ml-1 tracking-wider uppercase">TÊN HIỂN THỊ</Text>
                        <TextInput
                            className="px-4 py-3.5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-base"
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Nhập tên của bạn"
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    <View className="gap-2">
                        <Text className="text-xs font-bold text-gray-400 ml-1 tracking-wider uppercase">TIỂU SỬ</Text>
                        <TextInput
                            className="px-4 py-3.5 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-base h-28"
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Giới thiệu về bạn..."
                            placeholderTextColor="#94a3b8"
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View className="h-px bg-gray-100 dark:bg-gray-800 my-2" />

                    <View className="gap-2 opacity-70">
                        <Text className="text-xs font-bold text-gray-400 ml-1 tracking-wider uppercase">TÊN ĐĂNG NHẬP</Text>
                        <View className="px-4 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl flex-row items-center border border-gray-200 dark:border-gray-700">
                            <Text className="text-primary-500 font-bold mr-1">@</Text>
                            <Text className="text-base text-gray-600 dark:text-gray-300 font-medium">{user?.username || 'user'}</Text>
                        </View>
                    </View>

                    <View className="gap-2 opacity-70">
                        <Text className="text-xs font-bold text-gray-400 ml-1 tracking-wider uppercase">EMAIL LIÊN KẾT</Text>
                        <View className="px-4 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl flex-row items-center border border-gray-200 dark:border-gray-700">
                            <Ionicons name="mail-outline" size={18} color="#94a3b8" className="mr-3" />
                            <Text className="text-base text-gray-600 dark:text-gray-300 font-medium ml-2">{user?.email || 'N/A'}</Text>
                        </View>
                    </View>

                    <View className="gap-2">
                        <Text className="text-xs font-bold text-gray-400 ml-1 tracking-wider uppercase">CẤP ĐỘ KHÁM PHÁ</Text>
                        <View className="p-4 bg-primary-50/50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/30">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="font-bold text-primary-600 dark:text-primary-400">Level {user?.level || 1}</Text>
                                <Text className="text-xs text-gray-500">{user?.xp || 0} XP</Text>
                            </View>
                            <View className="h-2 bg-white dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                                <View
                                    className="h-full bg-primary-500"
                                    style={{ width: `${Math.min(((user?.xp || 0) % 1000) / 10, 100)}%` }}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    className="py-4 bg-primary-500 rounded-2xl items-center shadow-lg shadow-primary-500/30"
                    onPress={handleUpdate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white text-base font-bold">Cập nhật hồ sơ</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
