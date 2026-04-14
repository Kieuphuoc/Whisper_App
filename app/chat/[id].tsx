import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ActivityIndicator,
    StyleSheet,
    LayoutAnimation,
    UIManager,
    useColorScheme,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';

import { MyUserContext } from '@/configs/Context';
import { authApis, endpoints } from '@/configs/Apis';
import { useSocket } from '@/hooks/useSocket';

import Navbar from '../../components/chat_v2/Navbar';
import WelcomeMessage from '../../components/chat_v2/WelcomeMessage';
import SuggestionCards from '../../components/chat_v2/SuggestionCards';
import ChatList from '../../components/chat_v2/ChatList';
import MessageInput from '../../components/chat_v2/MessageInput';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams();
    const user = useContext(MyUserContext);
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme() || 'light';
    const isDark = scheme === 'dark';

    const [messages, setMessages] = useState<any[]>([]);
    const [room, setRoom] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const { connected, on, off, joinRoom, leaveRoom } = useSocket(user?.id);
    const roomId = parseInt(id as string, 10);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;
                const api = authApis(token);

                const roomsRes = await api.get(endpoints.chatRooms);
                const currentRoom = roomsRes.data.data.find((r: any) => r.id === roomId);
                setRoom(currentRoom);

                const msgRes = await api.get(endpoints.chatMessages(roomId));
                const fetchedMessages = msgRes.data.data.map((m: any) => ({
                    id: m.id.toString(),
                    text: m.content,
                    isMine: m.senderId === user?.id,
                    senderAvatar: m.sender?.avatar,
                    createdAt: m.createdAt,
                    attachments: m.type === 'FILE' ? [{ type: 'pdf', label: 'Document' }] : []
                }));

                setMessages(fetchedMessages);
            } catch (error) {
                console.error('Error fetching chat data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [roomId, user?.id]);

    useEffect(() => {
        if (!connected || !roomId) return;
        joinRoom(roomId);
        const handleNewMessage = (msg: any) => {
            if (msg.roomId === roomId) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id.toString())) return prev;
                    return [...prev, {
                        id: msg.id.toString(),
                        text: msg.content,
                        isMine: msg.senderId === user?.id,
                        senderAvatar: msg.sender?.avatar,
                        createdAt: msg.createdAt
                    }];
                });
            }
        };
        on('new_message', handleNewMessage);
        return () => {
            leaveRoom(roomId);
            off('new_message', handleNewMessage);
        };
    }, [connected, roomId, user?.id, joinRoom, leaveRoom, on, off]);

    const handleSend = async (text: string) => {
        if (sending) return;
        setSending(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            // Trigger animation specifically for the header disappearing if this is the first message
            if (messages.length === 0) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            }

            const res = await authApis(token).post(endpoints.chatSend(roomId), {
                content: text.trim(),
                type: 'TEXT',
            });

            const sentMessage = res.data?.data;
            if (sentMessage) {
                setMessages(prev => {
                    if (prev.some(m => m.id === sentMessage.id.toString())) return prev;
                    return [...prev, {
                        id: sentMessage.id.toString(),
                        text: sentMessage.content,
                        isMine: true,
                        createdAt: sentMessage.createdAt
                    }];
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const getDisplayName = () => {
        if (room?.isAnonymous) return "Kênh Chat Ẩn";
        const otherMember = room?.members?.find((m: any) => m.user?.id !== user?.id);
        const other = otherMember?.user;
        return room?.name || other?.displayName || other?.username || "Người Dùng Bí Ẩn";
    };

    const getDisplayAvatar = () => {
        if (room?.isAnonymous) return "";
        const otherMember = room?.members?.find((m: any) => m.user?.id !== user?.id);
        const other = otherMember?.user;
        return room?.avatar || other?.avatar || "";
    };

    const isOtherUserOnline = () => {
        if (!room || !room.members) return false;
        const otherMember = room.members.find((m: any) => m.user?.id !== user?.id);
        // Checking for typical online flags. Fallback to false if not found.
        return otherMember?.user?.isOnline || otherMember?.user?.isActive || false;
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#05060a' : '#f5f7ff' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
            
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={isDark ? ['#000000', '#05060a', '#05060a'] : ['#f5f7ff', '#eef2ff', '#f8fafc']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <MotiView
                    from={{ opacity: 0.15, scale: 1 }}
                    animate={{ opacity: 0.35, scale: 1.4 }}
                    transition={{ loop: true, type: 'timing', duration: 12000, repeatReverse: true }}
                    style={[styles.auraCircle, { backgroundColor: isDark ? 'rgba(139,92,246,0.64)' : 'rgba(196,181,253,0.88)', top: '-14%', left: '-22%' }]}
                />
                <MotiView
                    from={{ opacity: 0.1, scale: 1.2 }}
                    animate={{ opacity: 0.25, scale: 0.9 }}
                    transition={{ loop: true, type: 'timing', duration: 15000, repeatReverse: true }}
                    style={[styles.auraCircle, { backgroundColor: isDark ? 'rgba(16,185,129,0.68)' : 'rgba(167,139,250,0.75)', bottom: '10%', right: '-24%' }]}
                />
            </View>

            <BlurView intensity={isDark ? 28 : 54} tint={isDark ? "dark" : "light"} style={[styles.header, { paddingTop: insets.top }]}>
                <Navbar 
                    title={getDisplayName()} 
                    subtitle={room?.isAnonymous ? "Kênh Chat Ẩn Danh" : "Cuộc trò chuyện"} 
                    avatarUrl={getDisplayAvatar()}
                    isOnline={isOtherUserOnline()}
                />
            </BlurView>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // We can adjust this if needed, but 0 often works if Header is outside
            >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#8b5cf6" />
                    </View>
                ) : (
                    <View style={styles.content}>
                        <ChatList
                            messages={messages}
                            header={
                                messages.length === 0 ? (
                                    <View style={styles.listHeader}>
                                        <View style={styles.signalRow}>
                                            <BlurView intensity={26} tint={isDark ? 'dark' : 'light'} style={[styles.signalChip, { borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.95)' }]}>
                                                <LinearGradient
                                                    colors={isDark ? ['rgba(139,92,246,0.2)', 'transparent'] : ['rgba(139,92,246,0.1)', 'transparent']}
                                                    style={StyleSheet.absoluteFill}
                                                />
                                                <MotiView
                                                    from={{ opacity: 0.45 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ loop: true, type: 'timing', duration: 1200, repeatReverse: true }}
                                                >
                                                    <View style={[styles.signalDot, { backgroundColor: '#10b981' }]} />
                                                </MotiView>
                                                <View style={styles.signalTextWrap}>
                                                    <Text style={[styles.signalTitle, { color: isDark ? '#e9d5ff' : '#6d28d9' }]}>Sẵn sàng</Text>
                                                    <Text style={[styles.signalSub, { color: isDark ? 'rgba(255,255,255,0.64)' : '#6B7280' }]}>Kênh mã hóa hoạt động</Text>
                                                </View>
                                            </BlurView>
                                            <BlurView intensity={24} tint={isDark ? 'dark' : 'light'} style={[styles.signalChip, styles.signalChipTilt, { borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.9)' }]}>
                                                <LinearGradient
                                                    colors={isDark ? ['rgba(16,185,129,0.16)', 'transparent'] : ['rgba(16,185,129,0.08)', 'transparent']}
                                                    style={StyleSheet.absoluteFill}
                                                />
                                                <View style={styles.signalTextWrap}>
                                                    <Text style={[styles.signalTitle, { color: isDark ? '#d1fae5' : '#047857' }]}>Bảo mật</Text>
                                                    <Text style={[styles.signalSub, { color: isDark ? 'rgba(255,255,255,0.64)' : '#6B7280' }]}>Không để lộ danh tính</Text>
                                                </View>
                                            </BlurView>
                                        </View>
                                        <WelcomeMessage 
                                            name={getDisplayName()} 
                                            avatarUrl={getDisplayAvatar()}
                                        />
                                        <SuggestionCards />
                                    </View>
                                ) : null
                            }
                        />
                    </View>
                )}

                <MessageInput onSend={handleSend} />
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    auraCircle: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.65,
    },
    header: {
        backgroundColor: 'transparent',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    listHeader: {
        paddingBottom: 8,
    },
    signalRow: {
        flexDirection: 'row',
        gap: 10,
        marginHorizontal: 14,
        marginBottom: 12,
    },
    signalChip: {
        flex: 1,
        minHeight: 58,
        borderRadius: 20,
        borderWidth: 1.2,
        overflow: 'hidden',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 5,
    },
    signalChipTilt: {
        transform: [{ rotate: '1.5deg' }],
    },
    signalDot: {
        width: 9,
        height: 9,
        borderRadius: 999,
        marginRight: 8,
    },
    signalTextWrap: {
        flex: 1,
    },
    signalTitle: {
        fontSize: 10.5,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    signalSub: {
        marginTop: 2,
        fontSize: 10.5,
        fontWeight: '600',
    },
});



