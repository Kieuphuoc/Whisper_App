import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { MyUserContext } from '@/configs/Context';
import { authApis, endpoints } from '@/configs/Apis';
import { useSocket } from '@/hooks/useSocket';

// Import new modular components
import Navbar from '../../../../components/chat_v2/Navbar';
import WelcomeMessage from '../../../../components/chat_v2/WelcomeMessage';
import SuggestionCards from '../../../../components/chat_v2/SuggestionCards';
import ChatList from '../../../../components/chat_v2/ChatList';
import MessageInput from '../../../../components/chat_v2/MessageInput';

export default function ChatDetailScreen() {
    const { id } = useLocalSearchParams();
    const user = useContext(MyUserContext);
    const insets = useSafeAreaInsets();
    
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

                // Add dummy AI message if list is empty or for demo
                if (fetchedMessages.length === 0) {
                    fetchedMessages.push({
                        id: 'dummy-ai',
                        text: "Imagine that you are the manager and make me the list of summary points of this documents",
                        isMine: true,
                    });
                    fetchedMessages.push({
                        id: 'dummy-ai-resp',
                        text: "1. Resilient Tourism: Despite the global impact, international tourism showed significant resilience in 2022.\n2. Growth Predictions: Forecasts suggest that travel and tourism GDP will grow at 5.8% annually between 2022 and 2032.",
                        isMine: false,
                        senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
                        attachments: [{ type: 'pdf', label: 'Chat Files' }]
                    });
                }

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
            off('new_message');
        };
    }, [connected, roomId, user?.id, joinRoom, leaveRoom, on, off]);

    const handleSend = async (text: string) => {
        if (sending) return;
        setSending(true);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const res = await authApis(token).post(endpoints.chatSend(roomId), {
                content: text.trim(),
                type: 'TEXT',
            });

            const sentMessage = res.data?.data;
            if (sentMessage) {
                setMessages(prev => [...prev, {
                    id: sentMessage.id.toString(),
                    text: sentMessage.content,
                    isMine: true,
                    createdAt: sentMessage.createdAt
                }]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={[styles.header, { paddingTop: insets.top }]}>
                    <Navbar title={room?.name || "Chi tiết Chat"} subtitle="Whispering in real-time" />
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#111827" />
                    </View>
                ) : (
                    <View style={styles.content}>
                        <ChatList 
                            messages={messages} 
                            header={
                                <View style={styles.listHeader}>
                                    <WelcomeMessage name={user?.displayName || "Bạn"} />
                                    <SuggestionCards />
                                </View>
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
        backgroundColor: '#F7F6F1',
    },
    keyboardView: {
        flex: 1,
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
});



