import { Colors } from '@/constants/Colors';
import { Visibility } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type VisibilityFilterProps = {
  activeFilter: Visibility;
  setActiveFilter: (filter: Visibility) => void;
};

export default function VisibilityFilter({
  activeFilter,
  setActiveFilter,
}: VisibilityFilterProps) {
  const filters: Visibility[] = ['PRIVATE', 'FRIENDS', 'PUBLIC'];

  return (
    <View style={styles.container}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter;

        return (
          <TouchableOpacity
            key={filter}
            style={[styles.button, isActive && styles.activeButton]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.text, isActive && styles.activeText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 4,
  },

  button: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },

  activeButton: {
    backgroundColor: Colors.primary,
  },

  text: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
  },

  activeText: {
    color: '#fff',
    fontWeight: '600',
  },
});
