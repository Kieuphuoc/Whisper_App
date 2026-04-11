import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    StatusBar,
    useColorScheme,
    ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MotiView, MotiText } from 'moti';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MyUserContext } from '@/configs/Context';
import { authApis, endpoints } from '@/configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/constants/Theme';

export default function ChatListScreen() {
    const user = useContext(MyUserContext);
    const router = useRouter();
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];

    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRooms = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await authApis(token).get(endpoints.chatRooms);
            setRooms(res.data.data);
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const renderRoomItem = ({ item, index }: { item: any; index: number }) => {
        // Find the other member (not the current user)
        const otherMember = item.members.find((m: any) => m.userId !== user?.id)?.user;
        const lastMessage = item.lastMessage;

        return (
            <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 100, type: 'timing', duration: 500 }}
            >
                <TouchableOpacity
                    style={styles.roomCard}
                    onPress={() => router.push(`/chat/${item.id}`)}
                >
                    <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={styles.glassContent}>
                        <View style={styles.avatarContainer}>
                            {otherMember?.avatar ? (
                                <Image source={{ uri: otherMember.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: currentTheme.colors.primary + '20' }]}>
                                    <Ionicons name="person" size={24} color={currentTheme.colors.primary} />
                                </View>
                            )}
                            {/* Online status indicator */}
                            {(otherMember?.isOnline || otherMember?.isActive) && (
                                <View style={styles.onlineStatus} />
                            )}
                        </View>

                        <View style={styles.roomInfo}>
                            <View style={styles.roomHeader}>
                                <Text style={[styles.roomName, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
                                    {otherMember?.displayName || otherMember?.username || 'Bạn bè'}
                                </Text>
                                <Text style={styles.timeText}>
                                    {lastMessage ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </Text>
                            </View>
                            
                            <Text style={[styles.lastMessage, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]} numberOfLines={1}>
                                {lastMessage ? (
                                    lastMessage.type === 'VOICE' ? '🎤 Tin nhắn thoại' : lastMessage.content
                                ) : 'Bắt đầu cuộc trò chuyện...'}
                            </Text>
                        </View>

                        {/* Unread indicator */}
                        {item.unreadCount > 0 && (
                            <View style={[styles.unreadBadge, { backgroundColor: currentTheme.colors.primary }]} />
                        )}
                    </BlurView>
                </TouchableOpacity>
            </MotiView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
            
            {/* AURA BACKGROUND */}
            <View style={StyleSheet.absoluteFill}>
                <MotiView
                    from={{ opacity: 0.2, scale: 1 }}
                    animate={{ opacity: 0.4, scale: 1.5 }}
                    transition={{ loop: true, type: 'timing', duration: 15000, repeatReverse: true }}
                    style={[styles.auraCircle, { backgroundColor: isDark ? '#4338ca' : '#ddd6fe', top: -100, right: -100 }]}
                />
            </View>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <MotiText 
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}
                >
                    Tín Hiệu
                </MotiText>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={currentTheme.colors.primary} />
                </View>
            ) : (

                <FlatList
                    data={rooms}
                    renderItem={renderRoomItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color="rgba(128,128,128,0.3)" />
                            <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    auraCircle: {
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: 175,
        filter: 'blur(80px)',
    },
    header: {
        marginTop: 60,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(128,128,128,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    roomCard: {
        marginBottom: 16,
        borderRadius: 24,
        overflow: 'hidden',
    },
    glassContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: '#fff',
    },
    roomInfo: {
        marginLeft: 16,
        flex: 1,
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    roomName: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    timeText: {
        fontSize: 12,
        color: 'rgba(128,128,128,0.6)',
    },
    lastMessage: {
        fontSize: 14,
    },
    unreadBadge: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: 'rgba(128,128,128,0.5)',
    },
});
