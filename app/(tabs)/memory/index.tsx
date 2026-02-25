import { VoiceDetailModal } from '@/components/memory/VoiceDetailModel';
import { MemoryCard } from '@/components/MemoryCard';
import { voicePin } from '@/data/voicePin';
import { useMemory } from '@/hooks/useMemory';
import { VoicePin } from '@/types';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

type Props = {
  data?: VoicePin[];
};

export default function MemoryAlbum({ data }: Props) {
  const { memories, setYearFilter } = useMemory(data || voicePin);
  const [selected, setSelected] = useState<VoicePin | null>(null);

  return (
    <View style={styles.container}>
      {/* Timeline đơn giản */}
      <View style={styles.timeline}>
        {[2026, 2025, 2024].map((year) => (
          <Text
            key={year}
            style={styles.year}
            onPress={() => setYearFilter(year)}
          >
            {year}
          </Text>
        ))}
      </View>

      <FlatList
        data={memories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <MemoryCard item={item} onPress={() => setSelected(item)} />
        )}
      />

      <VoiceDetailModal
        visible={!!selected}
        data={selected}
        onClose={() => setSelected(null)}
        onShowMap={() => {
          // navigate map screen
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  timeline: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  year: {
    marginRight: 16,
    color: '#aaa',
  },
});
