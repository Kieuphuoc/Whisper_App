import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { MemoryCard } from '@/components/MemoryCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApis, endpoints } from "../../configs/Apis";

type Memory = {
    id: string;
    emoji: string;
    duration: string;
    createdAt: string;
    description: string;
    longitude: number;
    latitude: number;
    audioUrl: string;
    location: string;
    emotion: string;
};

type SortType = 'time' | 'location' | 'emotion';

export default function MemoriesScreen() {
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState<Memory[]>([]);
  const [activeSort, setActiveSort] = useState<SortType>('time');
  const [showSortOptions, setShowSortOptions] = useState(false);

  // const loadMemory = async () => {
  //   try {
  //     setLoading(true);
  //     const token = await AsyncStorage.getItem('token');
  //     if (!token) {
  //       throw new Error('No token found');
  //     }

  //     const res = await authApis(token).get(endpoints['voice'])
  //     const data = res.data;
      
  //     // Add mock location and emotion data for demo
  //     const enhancedData = data.map((item: any, index: number) => ({
  //       ...item,
  //       location: ['Central Park, NY', 'Coffee Shop, SF', 'Golden Gate Bridge', 'Library, Boston'][index % 4],
  //       emotion: ['😊', '🎵', '🌅', '📚', '🎉', '😢'][index % 6],
  //     }));
      
  //     setMemory(enhancedData);
  //   } catch (ex: any) {
  //     console.log('Error loading Memory:', ex);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  
  const loadMemory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const res = await authApis(token).get(endpoints['voice'])

      const data = res.data;
      console.log(data.data)
      setMemory(data.data);
    } catch (ex: any) {
      console.log('Error loading Memory:', ex);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemory();
  }, []);

  const sortMemories = (memories: Memory[], sortType: SortType) => {
    switch (sortType) {
      case 'time':
        return [...memories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'location':
        return [...memories].sort((a, b) => a.location.localeCompare(b.location));
      case 'emotion':
        return [...memories].sort((a, b) => a.emotion.localeCompare(b.emotion));
      default:
        return memories;
    }
  };

  // const getSortedMemories = () => {
  //   return sortMemories(memory, activeSort);
  // };

  const SortButton = () => (
    <TouchableOpacity 
      style={styles.sortButton}
      onPress={() => setShowSortOptions(!showSortOptions)}
    >
      <Ionicons name="funnel-outline" size={20} color="#374151" />
      <ThemedText style={styles.sortButtonText}>
        Sort by {activeSort.charAt(0).toUpperCase() + activeSort.slice(1)}
      </ThemedText>
      <Ionicons 
        name={showSortOptions ? "chevron-up" : "chevron-down"} 
        size={16} 
        color="#374151" 
      />
    </TouchableOpacity>
  );

  // const SortOptions = () => (
  //   <View style={styles.sortOptionsContainer}>
  //     {(['time', 'location', 'emotion'] as SortType[]).map((sortType) => (
  //       <TouchableOpacity
  //         key={sortType}
  //         style={[
  //           styles.sortOption,
  //           activeSort === sortType && styles.activeSortOption
  //         ]}
  //         onPress={() => {
  //           setActiveSort(sortType);
  //           setShowSortOptions(false);
  //         }}
  //       >
  //         <ThemedText style={[
  //           styles.sortOptionText,
  //           activeSort === sortType && styles.activeSortOptionText
  //         ]}>
  //           {sortType.charAt(0).toUpperCase() + sortType.slice(1)}
  //         </ThemedText>
  //         {activeSort === sortType && (
  //           <Ionicons name="checkmark" size={16} color="#22c55e" />
  //         )}
  //       </TouchableOpacity>
  //     ))}
  //   </View>
  // );

  const StatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statItem}>
        {/* <ThemedText style={styles.statNumber}>{memory.length}</ThemedText> */}
        <ThemedText style={styles.statLabel}>Total Memories</ThemedText>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <ThemedText style={styles.statNumber}>
          {/* {memory.reduce((acc, mem) => acc + parseInt(mem.duration.split(':')[0]) * 60 + parseInt(mem.duration.split(':')[1]), 0)} */}
        </ThemedText>
        <ThemedText style={styles.statLabel}>Total Minutes</ThemedText>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <ThemedText style={styles.statNumber}>
          {/* {new Set(memory.map(m => m.location)).size} */}
        </ThemedText>
        <ThemedText style={styles.statLabel}>Locations</ThemedText>
      </View>
    </View>
  );

  return (
    <ScrollView
      >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.title}>My Memories</ThemedText>
        <ThemedText style={styles.subtitle}>Your voice journey through time</ThemedText>
      </ThemedView>

      <StatsCard />

      <View style={styles.controlsContainer}>
        <SortButton />
        {/* {showSortOptions && <SortOptions />} */}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Loading your memories...</ThemedText>
        </View>
      ) : (
        <View style={styles.memoriesContainer}>
          {memory.map((item) => (
        <MemoryCard key={item.id} memory={item} />
      ))}

        </View>
      )}

      {/* {memory.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Ionicons name="mic-outline" size={64} color="#d1d5db" />
          <ThemedText style={styles.emptyTitle}>No memories yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Start recording your first voice memory on the map!
          </ThemedText>
        </View>
      )} */}
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '400',
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#22c55e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  controlsContainer: {
    marginBottom: 16,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  sortButtonText: {
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  sortOptionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activeSortOption: {
    backgroundColor: '#f0fdf4',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  activeSortOptionText: {
    color: '#22c55e',
    fontWeight: '600',
  },
  memoriesContainer: {
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
