import React from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import { theme } from "@/constants/Theme";

type StatsBentoProps = {
    voicePins: any[];
};

const StatsBento: React.FC<StatsBentoProps> = ({ voicePins }) => {
    const colorScheme = useColorScheme() || "light";
    const currentTheme = theme[colorScheme];

    return (
        <View style={[styles.statsBento, { 
            backgroundColor: currentTheme.colors.background + 'F2',
            borderColor: currentTheme.colors.primary + '1A',
        }]}>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{voicePins.length}</Text>
                <Text style={[styles.statLabel, { color: currentTheme.colors.textSecondary }]}>Voices</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
                <Text style={styles.statNumber}>1.2km</Text>
                <Text style={[styles.statLabel, { color: currentTheme.colors.textSecondary }]}>Radius</Text>
            </View>
        </View>
    );
};

export default StatsBento;

const styles = StyleSheet.create({
    statsBento: {
        position: "absolute",
        top: 140,
        right: 16,
        borderRadius: 20,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    statItem: {
        alignItems: "center",
    },

    statNumber: {
        fontSize: 18,
        fontWeight: "700",
        color: "#8b5cf6",
        marginBottom: 2,
    },

    statLabel: {
        fontSize: 10,
        color: "#6b7280",
        fontWeight: "500",
    },

    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: "rgba(139, 92, 246, 0.2)",
    },
});