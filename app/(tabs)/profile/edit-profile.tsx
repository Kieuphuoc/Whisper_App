import { authApis, endpoints } from '@/configs/Apis';
import { MyDispatchContext, MyUserContext } from '@/configs/Context';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function EditProfileScreen() {
    const router = useRouter();
    const userContext = useContext(MyUserContext) as User | null;
    const dispatch = useContext(MyDispatchContext);

    const [displayName, setDisplayName] = useState(userContext?.displayName || '');
    const [bio, setBio] = useState(userContext?.bio || '');
    const [avatar, setAvatar] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const getAvatarUri = (avatar?: string) => {
        if (!avatar) return 'https://i.pinimg.com/736x/8e/71/84/8e7184285e6b72a4f49492167d4f6696.jpg';
        if (avatar.startsWith('http')) return avatar;
        return `http://10.5.1.149:5000${avatar.startsWith('/') ? '' : '/'}${avatar}`;
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setAvatar(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const api = authApis(token);

            // 1. Update Profile Info
            const profileRes = await api.put(endpoints.userMe, {
                displayName,
                bio,
            });

            // 2. Update Avatar if changed
            let updatedUser = profileRes.data?.data || profileRes.data;

            if (avatar) {
                const formData = new FormData();
                const filename = avatar.split('/').pop() || 'avatar.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image`;

                formData.append('avatar', {
                    uri: avatar,
                    name: filename,
                    type,
                } as any);

                const avatarRes = await api.put(endpoints.userMe + '/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                updatedUser = avatarRes.data?.data || avatarRes.data;
            }

            // Update Context
            if (dispatch) {
                dispatch({ type: 'SET_USER', payload: updatedUser });
            }
            await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

            Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Update profile error:', error);
            const message = error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ';
            Alert.alert('Thất bại', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-white"
        >
            {/* Header */}
            <View className="pt-14 pb-4 px-6 flex-row items-center border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-[#1e293b]">Chỉnh sửa hồ sơ</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
                <Animated.View entering={FadeInDown.duration(500)} className="items-center mb-10">
                    <TouchableOpacity onPress={pickImage} className="relative">
                        <Image
                            source={{ uri: avatar || getAvatarUri(userContext?.avatar) }}
                            className="w-32 h-32 rounded-full border-4 border-gray-50"
                        />
                        <View className="absolute bottom-0 right-0 bg-secondary-500 w-10 h-10 rounded-full items-center justify-center border-4 border-white">
                            <Ionicons name="camera" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text className="text-secondary-500 font-semibold mt-4">Thay đổi ảnh đại diện</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(100).duration(500)}>
                    <View className="mb-6">
                        <Text className="text-gray-500 font-semibold mb-2 ml-1">Tên hiển thị</Text>
                        <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-1">
                            <TextInput
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Nhập tên hiển thị"
                                className="py-3 text-[#1e293b] font-medium"
                            />
                        </View>
                    </View>

                    <View className="mb-6">
                        <Text className="text-gray-500 font-semibold mb-2 ml-1">Tiểu sử</Text>
                        <View className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-1">
                            <TextInput
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Kể về bản thân bạn..."
                                multiline
                                numberOfLines={4}
                                className="py-3 text-[#1e293b] min-h-[100px]"
                                textAlignVertical="top"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        className={`mt-10 py-5 rounded-3xl items-center shadow-lg shadow-primary-200 ${loading ? 'bg-gray-300' : 'bg-primary-500'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Lưu thay đổi</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>

                <View className="h-20" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
