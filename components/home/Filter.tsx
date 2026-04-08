import { Visibility } from "@/types";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";

const SEGMENT_PURPLE = "#8B5CF6";
const SEGMENT_SURFACE = "#FFFFFF";
const SEGMENT_INACTIVE_TEXT = "#171717";

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
            <View style={styles.filterBento}>
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
                                { color: SEGMENT_INACTIVE_TEXT },
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
        right: 16,
        zIndex: 1,
    },

    filterBento: {
        flexDirection: "row",
        borderRadius: 20,
        padding: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
    },

    filterButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        alignItems: "center",
    },

    activeFilterButton: {
        backgroundColor: "#8b5cf6",
        shadowColor: "#8b5cf6",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
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