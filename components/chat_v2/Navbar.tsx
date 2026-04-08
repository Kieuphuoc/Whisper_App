import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const Navbar = ({ title = "Whisper Chat", subtitle = "Messaging with Voice Intelligence" }) => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <View style={styles.headerCopy}>
                    <Text style={styles.headerEyebrow}>{title.toUpperCase()}</Text>
                    <Text style={styles.headerHint}>{subtitle}</Text>
                </View>

                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.back()}
                    style={styles.closeButton}
                >
                    <Ionicons name="close" size={18} color="#111827" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 22,
        paddingVertical: 16,
        backgroundColor: 'transparent',
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
    },
    headerCopy: {
        flex: 1,
    },
    headerEyebrow: {
        fontSize: 11,
        lineHeight: 15,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: "#6B7280",
        fontWeight: "700",
    },
    headerHint: {
        marginTop: 4,
        fontSize: 12,
        lineHeight: 18,
        color: "#9CA3AF",
        fontWeight: "500",
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.84)",
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
    },
});

export default Navbar;

