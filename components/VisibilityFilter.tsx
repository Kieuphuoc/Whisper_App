import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type FilterType = 'personal' | 'friends' | 'public';

type FilterVisibilityProps = {
    activeFilter: FilterType;
    setActiveFilter: (filter: FilterType) => void;
    onPress?: ()=> void;
};

export default function VisibilityFilter({ activeFilter, setActiveFilter, onPress }: FilterVisibilityProps) {
    return (
        <View style={styles.filterContainer}>
            <View style={styles.filterBento}>
                {(['personal', 'friends', 'public'] as FilterType[]).map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        style={[
                            styles.filterButton,
                            activeFilter === filter && styles.activeFilterButton
                        ]}
                        onPress={() => {
                            setActiveFilter(filter);
                            onPress?.();
                        }}>
                        <Text style={[
                            styles.filterText,
                            activeFilter === filter && styles.activeFilterText
                        ]}>
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    filterContainer: {
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1,
    },
    filterBento: {
        flexDirection: 'row',
        backgroundColor: Colors.black,
        borderRadius: 25,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    filterButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 25,
        alignItems: 'center',
    },
    activeFilterButton: {
        backgroundColor: Colors.primary,
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.white,
    },
    activeFilterText: {
        color: Colors.white,
        fontWeight: '600',
    },
});
