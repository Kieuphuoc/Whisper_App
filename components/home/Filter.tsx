import { Visibility } from "@/types";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";



type FilterToggleProps = {
    value: Visibility;
    onChange: (filter: Visibility) => void;
};

const OPTIONS: { value: Visibility; label: string }[] = [
    { value: 'PRIVATE', label: 'Cá nhân' },
    { value: 'FRIENDS', label: 'Bạn bè' },
    { value: 'PUBLIC', label: 'Khám phá' },
];

const FilterToggle: React.FC<FilterToggleProps> = ({
    value,
    onChange,
}) => {
    return (
        <View style={styles.filterContainer}>
            <View style={styles.filterContent}>
                {OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[
                            styles.filterButton,
                            value === opt.value && styles.activeFilterButton,
                        ]}
                        onPress={() => onChange(opt.value)}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                value === opt.value && styles.activeFilterText,
                            ]}
                        >
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

export default FilterToggle;

const styles = StyleSheet.create({
    filterContainer: {
        position: "absolute",
        top: 60,
        left: 16,
        zIndex: 10,
    },

    filterContent: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        borderRadius: 25,
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },

    filterButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },

    activeFilterButton: {
        backgroundColor: "#8b5cf6",
    },

    filterText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#6b7280",
    },

    activeFilterText: {
        color: "#ffffff",
        fontWeight: "700",
    },
});