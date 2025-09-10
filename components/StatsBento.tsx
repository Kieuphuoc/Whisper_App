// StatsBento.tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type StatsBentoProps = {
  voicesCount: number;
  radius: string; // vd: '1.2km'
};

export default function StatsBento({ voicesCount, radius }: StatsBentoProps) {
  return (
    <View style={styles.statsBento}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{voicesCount}</Text>
        <Text style={styles.statLabel}>Voices</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{radius}</Text>
        <Text style={styles.statLabel}>Radius</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsBento: {
    position: 'absolute',
    top: 140,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    marginHorizontal: 12,
  },
});
