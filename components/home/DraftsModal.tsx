import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    useColorScheme,
    Modal,
    StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { Text } from '@/components/ui/text';
import { theme } from '@/constants/Theme';
import { DraftStorage, VoiceDraft } from '@/utils/draftStorage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

type Props = {
    visible: boolean;
    onClose: () => void;
    onSelectDraft: (draft: VoiceDraft) => void;
};

function timeAgo(timestamp: number) {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Vừa xong';
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} ngày trước`;
    return new Date(timestamp).toLocaleDateString('vi-VN');
}

export default function DraftsModal({ visible, onClose, onSelectDraft }: Props) {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];
    const isDark = colorScheme === 'dark';
    const [drafts, setDrafts] = useState<VoiceDraft[]>([]);

    useEffect(() => {
        if (visible) {
            loadDrafts();
        }
    }, [visible]);

    const loadDrafts = async () => {
        const data = await DraftStorage.getDrafts();
        setDrafts(data);
    };

    const handleDeleteDraft = async (id: string) => {
        await DraftStorage.deleteDraft(id);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        loadDrafts();
    };

    const renderDraftItem = ({ item, index }: { item: VoiceDraft; index: number }) => (
        <MotiView
            from={{ opacity: 0, translateX: -10 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: index * 100 }}
            style={styles.itemWrapper}
        >
            <TouchableOpacity
                onPress={() => {
                    onSelectDraft(item);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.9}
                style={[
                    styles.itemContainer,
                    {
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.7)'
                    }
                ]}
            >
                <View style={styles.leftCol}>
                    <View style={styles.iconContainer}>
                        <LinearGradient 
                            colors={['#8b5cf6', '#6d28d9']} 
                            style={styles.iconGradient}
                        >
                            <Ionicons name="mic" size={22} color="#fff" />
                        </LinearGradient>
                        <View style={[styles.miniTypeIcon, { backgroundColor: '#8b5cf6' }]}>
                            <Ionicons name="document-text" size={10} color="#fff" />
                        </View>
                    </View>
                </View>

                <View style={styles.rightCol}>
                    <View style={styles.itemMeta}>
                        <Text style={[styles.typeLabel, { color: '#8b5cf6' }]}>Bản nháp âm thanh</Text>
                        <Text style={styles.timeText}>{timeAgo(item.timestamp)}</Text>
                    </View>
                    
                    <View>
                        <Text numberOfLines={2} style={[styles.messageText, { color: isDark ? '#e2e8f0' : '#4b5563' }]}>
                            {item.transcription ? `"${item.transcription}"` : "Bạn đã ghi lại một kỷ niệm nhưng chưa đăng."}
                        </Text>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: currentTheme.colors.primary }]}
                            onPress={() => onSelectDraft(item)}
                        >
                            <Text style={styles.actionButtonText}>Tiếp tục chỉnh sửa</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.actionButton, styles.secondaryAction, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]}
                            onPress={() => handleDeleteDraft(item.id)}
                        >
                            <Ionicons name="trash-outline" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </MotiView>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

                <View style={StyleSheet.absoluteFill}>
                    <LinearGradient
                        colors={isDark ? ['#1e1b4b', '#000'] : ['#f5f3ff', '#fff']}
                        style={StyleSheet.absoluteFill}
                    />
                    <MotiView
                        from={{ opacity: 0.2, scale: 1 }}
                        animate={{ opacity: 0.4, scale: 1.5 }}
                        transition={{ loop: true, type: 'timing', duration: 15000, repeatReverse: true }}
                        style={[styles.auraCircle, { backgroundColor: isDark ? '#4338ca' : '#ddd6fe', top: -50, right: -100 }]}
                    />
                    <BlurView 
                        intensity={isDark ? 100 : 60} 
                        tint={isDark ? "dark" : "light"} 
                        style={StyleSheet.absoluteFill} 
                    />
                </View>

                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.headerIconBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="arrow-back" size={20} color={currentTheme.colors.primary} />
                        </TouchableOpacity>
                        <View>
                            <Text style={[styles.title, { color: isDark ? '#fff' : '#111827' }]}>Bản nháp</Text>
                            <Text style={styles.subtitle}>Tiếp tục những kỷ niệm dang dở</Text>
                        </View>
                    </View>
                </View>

                {drafts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MotiView
                            from={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'spring' }}
                            style={styles.emptyIconBox}
                        >
                            <Ionicons name="document-text" size={60} color={isDark ? "rgba(255,255,255,0.05)" : "#f3f4f6"} />
                        </MotiView>
                        <Text style={styles.emptyText}>Hiện tại chưa có bản nháp nào.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={drafts}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={renderDraftItem}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    auraCircle: {
        position: 'absolute',
        width: width,
        height: width,
        borderRadius: width / 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: { fontSize: 34, fontWeight: '900', letterSpacing: -1.5 },
    subtitle: { fontSize: 13, color: '#9ca3af', fontWeight: '500', marginTop: -2 },
    headerIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    listContent: { paddingHorizontal: 20, paddingBottom: 50 },
    itemWrapper: {
        borderRadius: 28,
        overflow: 'hidden',
    },
    itemContainer: {
        flexDirection: 'row',
        padding: 18,
        gap: 15,
        borderWidth: 1.2,
        borderRadius: 28,
    },
    leftCol: {
        justifyContent: 'flex-start',
    },
    iconContainer: {
        width: 54,
        height: 54,
        position: 'relative',
    },
    iconGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    miniTypeIcon: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    rightCol: { flex: 1, gap: 4 },
    itemMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    typeLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    timeText: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
    messageText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryAction: {
        width: 40,
        height: 40,
        paddingHorizontal: 0,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    actionButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(0,0,0,0.02)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { color: '#9ca3af', fontSize: 14, fontWeight: '500', textAlign: 'center' },
});
