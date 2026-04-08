import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SUGGESTIONS = [
    {
        id: '1',
        icon: 'document-text-outline',
        title: 'Project Brief',
        desc: 'Summary points of this doc',
        accent: '#3B82F6',
    },
    {
        id: '2',
        icon: 'analytics-outline',
        title: 'Growth Preds',
        desc: 'Analyze trends for 2026',
        accent: '#EF4444',
    },
    {
        id: '3',
        icon: 'stats-chart-outline',
        title: 'Market Report',
        desc: 'Extract key insights',
        accent: '#10B981',
    }
];

const SuggestionCards = () => {
    return (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            style={styles.container}
        >
            {SUGGESTIONS.map((item) => (
                <TouchableOpacity 
                    key={item.id}
                    activeOpacity={0.85}
                    style={styles.card}
                >
                    <View style={[styles.iconBox, { backgroundColor: `${item.accent}15` }]}>
                        <Ionicons name={item.icon as any} size={18} color={item.accent} />
                    </View>
                    <View style={styles.copyBox}>
                        <Text style={styles.metaLabel}>{item.title}</Text>
                        <Text style={styles.metaPrimary} numberOfLines={2}>
                            {item.desc}
                        </Text>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    scrollContent: {
        paddingHorizontal: 22,
        gap: 12,
        paddingBottom: 4,
    },
    card: {
        width: 170,
        minHeight: 120,
        borderRadius: 22,
        padding: 16,
        backgroundColor: "rgba(255,255,255,0.8)",
        borderWidth: 1,
        borderColor: "#ECECEC",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    copyBox: {
        marginTop: 12,
    },
    metaLabel: {
        fontSize: 10,
        color: "#9CA3AF",
        textTransform: "uppercase",
        letterSpacing: 1.2,
        fontWeight: "700",
    },
    metaPrimary: {
        marginTop: 4,
        fontSize: 14,
        lineHeight: 18,
        color: "#111827",
        fontWeight: "700",
    },
});

export default SuggestionCards;

