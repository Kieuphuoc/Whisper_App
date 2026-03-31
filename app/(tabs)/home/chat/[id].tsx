import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    useColorScheme,
    ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView, AnimatePresence } from 'moti';
import { Image } from 'expo-image';
import { MyUserContext } from '@/configs/Context';
import { authApis, endpoints } from '@/configs/Apis';
import { useSocket } from '@/hooks/useSocket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/constants/Theme';

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams();
    const user = useContext(MyUserContext);
    const router = useRouter();
    const colorScheme = useColorScheme() || 'light';
    const isDark = colorScheme === 'dark';
    const currentTheme = theme[colorScheme];

    const [messages, setMessages] = useState<any[]>([]);
    const [room, setRoom] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    
    const flatListRef = useRef<FlatList>(null);
    const { on, off, emit, joinRoom, leaveRoom } = useSocket(user?.id);

    const roomId = parseInt(id as string);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                if (!token) return;
                const api = authApis(token);

                // Fetch room details to get other user name/avatar
                const roomsRes = await api.get(endpoints.chatRooms);
                const currentRoom = roomsRes.data.data.find((r: any) => r.id === roomId);
                setRoom(currentRoom);

                // Fetch message history
                const msgRes = await api.get(endpoints.chatMessages(roomId));
                setMessages(msgRes.data.data);
            } catch (error) {
                console.error('Error fetching chat data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
        joinRoom(roomId);

        // Listen for real-time messages
        on('new_message', (msg: any) => {
            if (msg.roomId === roomId) {
                setMessages(prev => [...prev, msg]);
            }
        });

        return () => {
            leaveRoom(roomId);
            off('new_message');
        };
    }, [roomId, joinRoom, leaveRoom, on, off]);

    const handleSend = async () => {
        if (!inputText.trim() || sending) return;

        setSending(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            
            await authApis(token).post(endpoints.chatSend(roomId), {
                content: inputText.trim(),
                type: 'TEXT'
            });
            
            setInputText('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const renderMessage = ({ item, index }: { item: any; index: number }) => {
        const isMine = item.senderId === user?.id;
        
        return (
            <MotiView
                from={{ opacity: 0, scale: 0.9, translateY: 10 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                style={[
                    styles.messageWrapper,
                    isMine ? styles.myMessageWrapper : styles.otherMessageWrapper
                ]}
            >
                {!isMine && (
                  <Image 
                    source={{ uri: item.sender.avatar }} 
                    style={styles.smallAvatar} 
                  />
                )}
                <View style={[
                   styles.bubbleContainer,
                   isMine ? styles.myBubbleContainer : styles.otherBubbleContainer
                ]}>
                    <BlurView 
                        intensity={isDark ? 40 : 80} 
                        tint={isMine ? (isDark ? 'dark' : 'light') : (isDark ? 'dark' : 'light')} 
                        style={[
                            styles.bubble,
                            isMine ? [styles.myBubble, { backgroundColor: currentTheme.colors.primary + '30' }] : styles.otherBubble
                        ]}
                    >
                        <Text style={[styles.messageText, { color: isDark ? '#fff' : '#000' }]}>
                            {item.content}
                        </Text>
                        <Text style={styles.messageTime}>
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </BlurView>
                </View>
            </MotiView>
        );
    };

    const otherUser = room?.members?.find((m: any) => m.userId !== user?.id)?.user;

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

            {/* HEADER */}
            <BlurView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    
                    <View style={styles.headerUser}>
                        {otherUser?.avatar ? (
                            <Image source={{ uri: otherUser.avatar }} style={styles.headerAvatar} />
                        ) : (
                            <View style={[styles.headerAvatar, { backgroundColor: currentTheme.colors.primary + '20' }]}>
                                <Ionicons name="person" size={16} color={currentTheme.colors.primary} />
                            </View>
                        )}
                        <View>
                            <Text style={[styles.headerName, { color: isDark ? '#fff' : '#000' }]}>
                                {otherUser?.displayName || otherUser?.username || 'Đang tải...'}
                            </Text>
                            <Text style={styles.headerStatus}>Trực tuyến</Text>
                        </View>
                    </View>

                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerActionButton}>
                            <Ionicons name="call-outline" size={20} color={isDark ? '#fff' : '#000'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </BlurView>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={currentTheme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}

            {/* INPUT BAR */}
            <View style={styles.inputContainer}>
                <BlurView intensity={isDark ? 40 : 80} tint={isDark ? 'dark' : 'default'} style={styles.inputGlass}>
                    <TouchableOpacity style={styles.attachmentButton}>
                        <Ionicons name="add-circle-outline" size={28} color={currentTheme.colors.primary} />
                    </TouchableOpacity>
                    
                    <TextInput
                        style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                        placeholder="Nhắn tin..."
                        placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                    />

                    {inputText.trim() ? (
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                            <LinearGradient 
                                colors={[currentTheme.colors.primary, currentTheme.colors.secondary || '#6366f1']}
                                style={styles.sendGradient}
                            >
                                <Ionicons name="send" size={18} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.micButton}>
                            <Ionicons name="mic-outline" size={24} color={currentTheme.colors.primary} />
                        </TouchableOpacity>
                    )}
                </BlurView>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 50,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(128,128,128,0.2)',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    headerUser: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
    },
    headerStatus: {
        fontSize: 11,
        color: '#22c55e',
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
    },
    headerActionButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(128,128,128,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    messageList: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    messageWrapper: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    myMessageWrapper: {
        justifyContent: 'flex-end',
    },
    otherMessageWrapper: {
        justifyContent: 'flex-start',
    },
    smallAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
        marginBottom: 4,
    },
    bubbleContainer: {
        maxWidth: '75%',
    },
    myBubbleContainer: {
        alignItems: 'flex-end',
    },
    otherBubbleContainer: {
        alignItems: 'flex-start',
    },
    bubble: {
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    myBubble: {
       borderBottomRightRadius: 4,
    },
    otherBubble: {
       borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    messageTime: {
        fontSize: 10,
        color: 'rgba(128,128,128,0.6)',
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inputContainer: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    inputGlass: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        paddingHorizontal: 8,
        paddingVertical: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(128,128,128,0.2)',
    },
    attachmentButton: {
        padding: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 4,
    },
    sendGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    micButton: {
        padding: 8,
    },
});
