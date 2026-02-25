import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Colors } from '@/constants/Colors';
import {
  Visibility,
  VISIBILITY_LABEL,
  VISIBILITY_LIST,
} from '@/types';

type Props = {
  value: Visibility;
  onChange: (v: Visibility) => void;
};

export default function VisibilityFilter({ value, onChange }: Props) {
  return (
    <View style={styles.filterContainer}>
      <View style={styles.filterBento}> 
        {VISIBILITY_LIST.map((v)=> (
          <TouchableOpacity key={v} onPress={() => onChange(v)} style={[styles.filterButton, value === v && styles.activeFilterButton]}>
          <Text style={[styles.filterText, value === v && styles.activeFilterText]}>
            {VISIBILITY_LABEL[v]}
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
        backgroundColor: Colors.button,
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
        color: Colors.lightText,
    },
    activeFilterText: {
        color: Colors.white,
        fontWeight: '600',
    },
});
