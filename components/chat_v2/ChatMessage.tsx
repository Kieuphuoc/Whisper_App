import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import AttachmentCard from './AttachmentCard';

interface ChatMessageProps {
    message: {
        id: string;
        text: string;
        isMine: boolean;
        senderAvatar?: string;
        attachments?: Array<{ type: 'pdf' | 'doc'; label: string }>;
    };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const { text, isMine, senderAvatar, attachments } = message;

    const renderContent = (content: string) => {
        const lines = content.split('\n');
        return lines.map((line, index) => {
            const isListItem = /^\d+\./.test(line.trim());
            if (isListItem) {
                const [num, ...rest] = line.trim().split('. ');
                return (
                    <View key={index} style={styles.listItem}>
                        <Text style={[styles.listIndex, isMine ? styles.textMine : styles.textOther]}>{num}.</Text>
                        <Text style={[styles.textBase, isMine ? styles.textMine : styles.textOther, styles.flex1]}>{rest.join('. ')}</Text>
                    </View>
                );
            }
            return (
                <Text key={index} style={[styles.textBase, isMine ? styles.textMine : styles.textOther, styles.mb2]}>
                    {line}
                </Text>
            );
        });
    };

    return (
        <MotiView 
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 350 }}
            style={[styles.container, isMine ? styles.containerMine : styles.containerOther]}
        >
            {!isMine && (
                <View style={styles.avatarWrapper}>
                    <Image 
                        source={{ uri: senderAvatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330" }} 
                        style={styles.avatar}
                    />
                </View>
            )}
            
            <View style={[styles.bubbleWrapper, isMine ? styles.itemsEnd : styles.itemsStart]}>
                <View 
                    style={[
                        styles.bubble,
                        isMine ? styles.bubbleMine : styles.bubbleOther
                    ]}
                >
                    {renderContent(text)}
                </View>
                
                {attachments?.map((att, idx) => (
                    <AttachmentCard key={idx} type={att.type} label={att.label} />
                ))}
            </View>
        </MotiView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    containerMine: {
        justifyContent: 'flex-end',
    },
    containerOther: {
        justifyContent: 'flex-start',
    },
    avatarWrapper: {
        marginRight: 10,
        justifyContent: 'flex-end',
        paddingBottom: 2,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
    },
    bubbleWrapper: {
        maxWidth: '82%',
    },
    itemsEnd: {
        alignItems: 'flex-end',
    },
    itemsStart: {
        alignItems: 'flex-start',
    },
    bubble: {
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    bubbleMine: {
        backgroundColor: '#111827',
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#ECECEC',
    },
    textBase: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '500',
    },
    textMine: {
        color: '#FFFFFF',
    },
    textOther: {
        color: '#374151',
    },
    mb2: {
        marginBottom: 8,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    flex1: {
        flex: 1,
    },
    listIndex: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '700',
        marginRight: 6,
    },
});

export default ChatMessage;

