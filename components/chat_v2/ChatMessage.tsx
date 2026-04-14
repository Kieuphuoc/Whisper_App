import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import AttachmentCard from './AttachmentCard';
import { LinearGradient } from 'expo-linear-gradient';

interface ChatMessageProps {
    message: {
        id: string;
        text: string;
        isMine: boolean;
        senderAvatar?: string;
        attachments?: Array<{ type: 'pdf' | 'doc'; label: string }>;
        createdAt?: string;
        showAvatar?: boolean;
        showTimestamp?: boolean;
        showDateHeader?: boolean;
    };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
    const { text, isMine, senderAvatar, attachments, createdAt, showAvatar, showTimestamp, showDateHeader } = message;
    const scheme = useColorScheme() || 'light';
    const isDark = scheme === 'dark';

    const formatTime = (iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateHeader = (iso?: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return d.toLocaleDateString('vi-VN', options);
    };

    const renderContent = (content: string) => {
        const lines = content.split('\n');
        return lines.map((line, index) => {
            const isListItem = /^\d+\./.test(line.trim());
            if (isListItem) {
                const [num, ...rest] = line.trim().split('. ');
                return (
                    <View key={index} style={styles.listItem}>
                        <Text style={[styles.listIndex, isMine ? styles.textMine : { color: isDark ? 'rgba(255,255,255,0.92)' : '#111827' }]}>{num}.</Text>
                        <Text style={[styles.textBase, isMine ? styles.textMine : { color: isDark ? 'rgba(255,255,255,0.92)' : '#111827' }, styles.flex1]}>{rest.join('. ')}</Text>
                    </View>
                );
            }
            return (
                <Text key={index} style={[styles.textBase, isMine ? styles.textMine : { color: isDark ? 'rgba(255,255,255,0.92)' : '#111827' }, styles.mb2]}>
                    {line}
                </Text>
            );
        });
    };

    return (
        <View>
            {showDateHeader && (
                <View style={styles.dateHeaderWrap}>
                    <View style={[styles.dateHeaderPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.05)' }]}>
                        <Text style={[styles.dateHeaderLabel, { color: isDark ? 'rgba(216,180,254,0.95)' : '#6d28d9' }]}>Thời gian</Text>
                        <Text style={[styles.dateHeaderText, { color: isDark ? 'rgba(255,255,255,0.56)' : '#6B7280' }]}>
                            {formatDateHeader(createdAt)}
                        </Text>
                    </View>
                </View>
            )}
            <MotiView
                from={{ opacity: 0, translateY: 12, scale: 0.97 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 160 }}
                style={[styles.container, isMine ? styles.containerMine : styles.containerOther, { marginBottom: showTimestamp ? 20 : 4 }]}
            >
                {!isMine && (
                    <View style={[styles.avatarWrapper, { paddingBottom: showTimestamp ? 22 : 2 }]}>
                        {showAvatar ? (
                            <Image
                                source={senderAvatar ? { uri: senderAvatar } : require('@/assets/images/avatar.png')}
                                style={styles.avatar}
                            />
                        ) : <View style={styles.avatarSpacer} />}
                    </View>
                )}

                <View style={[styles.bubbleWrapper, isMine ? styles.itemsEnd : styles.itemsStart]}>
                    {isMine ? (
                        <LinearGradient
                            colors={['#8b5cf6', '#a78bfa']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.bubble, styles.bubbleMine, !showAvatar && !isMine && { borderBottomLeftRadius: 18 }]}
                        >
                            {renderContent(text)}
                        </LinearGradient>
                    ) : (
                        <View
                            style={[
                                styles.bubble,
                                styles.bubbleOther,
                                {
                                    backgroundColor: isDark ? 'rgba(17,24,39,0.72)' : 'rgba(255,255,255,0.86)',
                                    borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.95)',
                                },
                                !showAvatar && !isMine && { borderBottomLeftRadius: 18 },
                            ]}
                        >
                            {renderContent(text)}
                        </View>
                    )}

                    {attachments?.map((att, idx) => (
                        <AttachmentCard key={idx} type={att.type} label={att.label} />
                    ))}

                    {showTimestamp && (
                        <Text style={[styles.timeText, { color: isDark ? 'rgba(255,255,255,0.45)' : '#9CA3AF' }]}>
                            {formatTime(createdAt)}
                        </Text>
                    )}
                </View>
            </MotiView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
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
    },
    avatarSpacer: {
        width: 32,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: '#E5E7EB',
        borderWidth: 1.2,
        borderColor: 'rgba(255,255,255,0.65)',
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 6,
    },
    bubbleMine: {
        borderWidth: 1.2,
        borderColor: 'rgba(255,255,255,0.24)',
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        // Will be merged dynamically
        borderBottomLeftRadius: 4,
        borderWidth: 1,
    },
    textBase: {
        fontSize: 14.5,
        lineHeight: 22,
        fontWeight: '600',
    },
    textMine: {
        color: '#FFFFFF',
    },
    mb2: {
        marginBottom: 0,
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
    timeText: {
        fontSize: 10.5,
        marginTop: 6,
        marginHorizontal: 4,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    dateHeaderWrap: {
        alignItems: 'center',
        marginVertical: 16,
    },
    dateHeaderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
        gap: 8,
    },
    dateHeaderLabel: {
        fontSize: 10.5,
        fontWeight: '800',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
    },
    dateHeaderText: {
        fontSize: 11,
        fontWeight: '600',
    },
});

export default ChatMessage;

