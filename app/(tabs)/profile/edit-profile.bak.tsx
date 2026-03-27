import { authApis, BASE_URL, endpoints } from '@/configs/Apis';
import { theme } from '@/constants/Theme';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useMemo, useContext } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
    Alert,
    useColorScheme,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    interpolate,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { MyDispatchContext, MyUserContext } from '@/configs/Context';

const { width, height } = Dimensions.get('window');

const GlassInput = ({ label, value, onChangeText, placeholder, icon, editable = true, multiline = false, leftContent }: any) => {
    const isDark = useColorScheme() === 'dark';
    
    return (
        <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.inputContainer}
        >
            <View style={styles.inputLabelRow}>
                <Ionicons name={icon} size={14} color="rgba(255,255,255,0.6)" style={{ marginRight: 6 }} />
                <Text style={styles.inputLabel}>{label}</Text>
            </View>
            <View style={[styles.glassInputBox, !editable && { opacity: 0.6 }]}>
                <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.innerInputRow}>
                    {leftContent}
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        editable={editable}
                        multiline={multiline}
                        style={[
                            styles.textInput,
                            multiline && { height: 100, textAlignVertical: 'top', paddingTop: 10 }
                        ]}
                    />
                </View>
            </View>
        </MotiView>
    );
};

export default function EditProfileScreen() {
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];
    const router = useRouter();
    const user = useContext(MyUserContext) as User | null;
    const dispatch = useContext(MyDispatchContext);

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [loading, setLoading] = useState(false);

    const shimmerProgress = useSharedValue(0);
    const buttonGlow = useSharedValue(0);

    useEffect(() => {
        // Start shimmer/glow loop for main action button
        shimmerProgress.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
                withDelay(4500, withTiming(0, { duration: 0 }))
            ),
            -1,
            false
        );
        buttonGlow.value = withRepeat(
            withSequence(
                withDelay(8000, withTiming(1, { duration: 1000 })),
                withTiming(0, { duration: 1000 })
            ),
            -1,
            false
        );
    }, []);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: interpolate(shimmerProgress.value, [0, 1], [-200, 400]) },
            { skewX: '-20deg' }
        ],
        opacity: interpolate(shimmerProgress.value, [0, 0.1, 0.9, 1], [0, 1, 1, 0])
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: buttonGlow.value * 0.5,
        transform: [{ scale: interpolate(buttonGlow.value, [0, 1], [1, 1.05]) }]
    }));

    const avatarUri = useMemo(() => {
        if (avatar) return avatar.uri;
        if (user?.avatar) {
            return user.avatar.startsWith('http')
                ? user.avatar
                : `${BASE_URL}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`;
        }
        return 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg';
    }, [avatar, user?.avatar]);

    const coverUri = useMemo(() => {
        if (!user?.cover) return null;
        return user.cover.startsWith('http')
            ? user.cover
            : `${BASE_URL}${user.cover.startsWith('/') ? '' : '/'}${user.cover}`;
    }, [user]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Quyền truy cập', 'Chúng tôi cần quyền truy cập thư viện ảnh để thay đổi avatar.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
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

            await api.put(endpoints.userMe, {
                displayName: trimmedName,
                bio: bio.trim(),
            });

            let updatedUser;
            if (avatar) {
                const formData = new FormData();
                const filename = avatar.uri.split('/').pop() || 'avatar.jpg';
                formData.append('avatar', {
                    uri: avatar.uri,
                    name: filename,
                    type: 'image/jpeg',
                } as any);

                const resAvatar = await api.put(endpoints.userAvatar, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                updatedUser = resAvatar.data?.data ?? resAvatar.data;
            } else {
                const resMe = await api.get(endpoints.userMe);
                updatedUser = resMe.data?.data ?? resMe.data;
            }

            if (dispatch && updatedUser) {
                dispatch({ type: 'SET_USER', payload: updatedUser });
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }

            Alert.alert('Thành công', 'Hồ sơ đã được đồng bộ hóa với thực tại kỹ thuật số.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e: any) {
            console.error('Update error:', e);
            Alert.alert('Thất bại', 'Tín hiệu cập nhật bị gián đoạn. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* BACKGROUND OVERLAY (Consistent with Profile) */}
            <View style={StyleSheet.absoluteFill}>
                {coverUri ? (
                    <Image source={{ uri: coverUri }} style={styles.fullscreenBackground} />
                ) : (
                    <LinearGradient
                        colors={[currentTheme.colors.primary, '#000']}
                        style={styles.fullscreenBackground}
                    />
                )}
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* GLASS HEADER */}
                <View style={styles.header}>
                    <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.headerIconButton}
                    >
                        <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                        <Ionicons name="close-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chỉnh sửa Aura</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* AVATAR SECTION */}
                    <View style={styles.avatarSection}>
                        <MotiView
                            from={{ scale: 0, rotate: '-15deg' }}
                            animate={{ scale: 1, rotate: '0deg' }}
                            transition={{ type: 'spring' }}
                            style={styles.avatarOuter}
                        >
                            <TouchableOpacity onPress={pickImage} activeOpacity={0.9}>
                                <Image source={{ uri: avatarUri }} style={styles.avatar} />
                                <View style={styles.cameraBadge}>
                                    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
                                    <Ionicons name="camera" size={16} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        </MotiView>
                    </View>

                    {/* FORM SECTION */}
                    <View style={styles.formSection}>
                        <GlassInput
                            label="Tên hiển thị"
                            icon="person-outline"
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Tên bạn muốn thế giới nhìn thấy"
                        />

                        <GlassInput
                            label="Tiểu sử (Bio)"
                            icon="chatbubble-outline"
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Mô tả tần số của bạn..."
                            multiline
                        />

                        <View style={styles.divider} />

                        {/* READ ONLY INFO */}
                        <GlassInput
                            label="Tên đăng nhập"
                            icon="at-outline"
                            value={user?.username || ''}
                            editable={false}
                            leftContent={<Text style={styles.atSymbol}>@</Text>}
                        />

                        <GlassInput
                            label="Email liên kết"
                            icon="mail-outline"
                            value={user?.email || 'Chưa định danh'}
                            editable={false}
                        />

                        {/* MAIN ACTION BUTTON */}
                        <TouchableOpacity
                            style={styles.mainButton}
                            onPress={handleUpdate}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            {/* PERIODIC GLOW EFFECT */}
                            <Animated.View
                                style={[
                                    StyleSheet.absoluteFill,
                                    glowStyle,
                                    {
                                        backgroundColor: currentTheme.colors.primary,
                                        borderRadius: 20,
                                        filter: 'blur(15px)'
                                    } as any
                                ]}
                            />

                            <LinearGradient
                                colors={['#7c3aed', '#4338ca']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />

                            {/* PERIODIC SHIMMER FLASH */}
                            <Animated.View
                                style={[
                                    {
                                        position: 'absolute',
                                        top: 0,
                                        bottom: 0,
                                        width: 100,
                                        backgroundColor: 'rgba(255,255,255,0.4)',
                                    },
                                    shimmerStyle
                                ]}
                            >
                                <LinearGradient
                                    colors={['transparent', 'rgba(255,255,255,0.6)', 'transparent']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>

                            <View style={styles.buttonInner}>
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <MotiView
                                        from={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        style={{ flexDirection: 'row', alignItems: 'center' }}
                                    >
                                        <Ionicons name="checkmark-done" size={20} color="#fff" style={{ marginRight: 10 }} />
                                        <Text style={styles.buttonText}>Cập nhật thực tại</Text>
                                    </MotiView>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    fullscreenBackground: { ...StyleSheet.absoluteFillObject },
    header: {
        height: 100,
        paddingTop: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        overflow: 'hidden',
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        zIndex: 100,
    },
    headerIconButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    scrollContent: { paddingBottom: 60 },
    avatarSection: { alignItems: 'center', marginVertical: 40 },
    avatarOuter: {
        width: 140,
        height: 140,
        borderRadius: 42,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
        elevation: 20,
        shadowColor: 'purple',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        overflow: 'visible',
    },
    avatar: { width: '100%', height: '100%', borderRadius: 38 },
    cameraBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 40,
        height: 40,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
        overflow: 'hidden',
    },
    formSection: { paddingHorizontal: 20, gap: 20 },
    inputContainer: { marginBottom: 4 },
    inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingLeft: 4 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' },
    glassInputBox: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        minHeight: 64,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    innerInputRow: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', flex: 1 },
    atSymbol: { fontSize: 18, fontWeight: '900', color: '#7c3aed', marginRight: 4 },
    textInput: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600', paddingVertical: 15 },
    divider: { height: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10, marginHorizontal: 10 },
    mainButton: {
        height: 64,
        borderRadius: 24,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        elevation: 15,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
    },
    buttonInner: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
