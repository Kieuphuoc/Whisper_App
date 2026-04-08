import React, { useRef, useEffect } from 'react';
import { FlatList, View } from 'react-native';
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

    return (
        <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item }) => <ChatMessage message={item} />}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => <View>{header}</View>}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 10 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        />
    );
};

export default ChatList;
