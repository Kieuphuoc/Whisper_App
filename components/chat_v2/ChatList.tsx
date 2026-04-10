import React, { useRef, useEffect } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import ChatMessage from './ChatMessage';

interface ChatListProps {
    messages: any[];
    header?: React.ReactNode;
}

const ChatList: React.FC<ChatListProps> = ({ messages, header }) => {
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes grouping
    const HOUR_MS = 60 * 60 * 1000;

    const processedMessages = messages.map((msg, index) => {
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];

        // Is the next message from the same person within 5 minutes?
        let isConsecutiveNext = false;
        if (nextMsg && nextMsg.isMine === msg.isMine) {
            const diff = new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime();
            if (diff < THRESHOLD_MS) isConsecutiveNext = true;
        }

        // Show a date header above the group if it's the first message or 1 hour later
        let showDateHeader = false;
        if (!prevMsg) {
            showDateHeader = true;
        } else {
            const diff = new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime();
            if (diff > HOUR_MS) showDateHeader = true;
        }

        return {
            ...msg,
            showAvatar: !isConsecutiveNext && !msg.isMine, 
            showTimestamp: !isConsecutiveNext, 
            showDateHeader
        };
    });

    return (
        <FlatList
            ref={flatListRef}
            data={processedMessages}
            renderItem={({ item }) => <ChatMessage message={item} />}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => <View>{header}</View>}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        />
    );
};

export default ChatList;
