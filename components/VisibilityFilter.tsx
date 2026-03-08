import { Colors } from '@/constants/Colors';
import { Visibility } from '@/types';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { theme } from '@/constants/Theme';

type VisibilityFilterProps = {
  activeFilter: Visibility;
  setActiveFilter: (filter: Visibility) => void;
};

export default function VisibilityFilter({
  activeFilter,
  setActiveFilter,
}: VisibilityFilterProps) {
  const colorScheme = useColorScheme() || 'light';
  const currentTheme = theme[colorScheme];
  const filters: Visibility[] = ['PRIVATE', 'FRIENDS', 'PUBLIC'];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.surfaceAlt }]}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter;

        return (
          <TouchableOpacity
            key={filter}
            style={[styles.button, isActive && { backgroundColor: Colors.primary }]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[styles.text, { color: currentTheme.colors.textMuted }, isActive && { color: Colors.white, fontWeight: '700' }]}>
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
    borderRadius: 20,
    padding: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 16,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
