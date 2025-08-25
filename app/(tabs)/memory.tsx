import { Image } from 'expo-image';
import React, { useEffect, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MemoryCard } from '@/components/MemoryCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';

type Memory = {
  id: number | string;
  emoji: string;
  duration: string;
  dateTime: string;
  text: string;
  location: string;
  progressColor: string;
};


export default function MemoriesScreen() {


  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState<Memory[]>([]);


  const loadMemory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch('http://192.168.3.16:5000/voice', {
        headers: { Authorization: token },
      });

      const data = await response.json();
      console.log('API data:', data);

        // const player = useAudioPlayer(data.audioUrl);


      if (data) {
        setMemory(data); // nếu là danh sách
      } else {
        console.log('Invalid memory data format:', data);
      }

    } catch (ex: any) {
      console.log('Error loading Memory:', ex);
      console.log('Error details:', ex.response?.data || ex.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemory();
  }, [])

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#d8f3dc', dark: '#1a1a1a' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">My Memories</ThemedText>
      </ThemedView>

      {memory.map((item) => (
        <MemoryCard key={item.id} memory={item} />
      ))}


    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    marginBottom: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  card: {
    padding: 12,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  imageBox: {
    width: 50,
    height: 50,
    backgroundColor: '#E6F4F1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  duration: {
    backgroundColor: '#d1fbe3',
    color: '#1A936F',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    marginRight: 8,
  },
  dateTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  location: {
    fontSize: 13,
    opacity: 0.6,
  },
  progressBar: {
    height: 4,
    borderRadius: 4,
    marginTop: 10,
  },
});
