import { View, StyleSheet, TouchableOpacity, ActivityIndicator, useColorScheme } from "react-native";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/Theme";

type QuickActionsProps = {
    onExplore?: () => void;
    onFriends?: () => void;
    onTrending?: () => void;
    isScanning?: boolean;
};

const QuickActions: React.FC<QuickActionsProps> = ({
    onExplore,
    onFriends,
    onTrending,
    isScanning,
}) => {
    const colorScheme = useColorScheme() || "light";
    const currentTheme = theme[colorScheme];

    return (
        <View style={[styles.quickActionsBento, {
            backgroundColor: currentTheme.colors.background + 'F2',
            borderColor: currentTheme.colors.primary + '1A',
        }]}>
            <TouchableOpacity style={styles.quickActionButton} onPress={onExplore} disabled={isScanning}>
                <View style={[styles.quickActionIcon, isScanning && { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                    {isScanning ? (
                        <ActivityIndicator size="small" color="#8b5cf6" />
                    ) : (
                        <Ionicons name="compass" size={20} color="#8b5cf6" />
                    )}
                </View>
                <Text style={[styles.quickActionText, { color: currentTheme.colors.textSecondary }]}>{isScanning ? "Đang quét..." : "Khám phá"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton} onPress={onFriends}>
                <View style={styles.quickActionIcon}>
                    <Ionicons name="people" size={20} color="#8b5cf6" />
                </View>
                <Text style={[styles.quickActionText, { color: currentTheme.colors.textSecondary }]}>Bạn bè</Text>
            </TouchableOpacity>

{/* <TouchableOpacity style={styles.quickActionButton} onPress={onTrending}>
    <View style={styles.quickActionIcon}>
        <Ionicons name="trending-up" size={20} color="#8b5cf6" />
    </View>
    <Text style={[styles.quickActionText, { color: currentTheme.colors.textSecondary }]}>Xu hướng</Text>
</TouchableOpacity> */}
        </View>
    );
};

export default QuickActions;

const styles = StyleSheet.create({
    quickActionsBento: {
        position: "absolute",
        top: 140,
        left: 16,
        borderRadius: 20,
        padding: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
    },

    quickActionButton: {
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginVertical: 4,
    },

    quickActionIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 4,
    },

    quickActionText: {
        fontSize: 14,
        color: "#6b7280",
        fontWeight: "600",
    },
});