// pages/admin/voices.tsx
import { VoiceRow } from '@/components/admin/VoiceRow';
import { voicePin } from '@/data/voicePin';
import { useAdminVoices } from '@/hooks/useAdminVoices';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminVoicesPage() {
  const {
    voices,
    setFilter,
    hideVoice,
    deleteVoice,
  } = useAdminVoices(voicePin);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="shield-checkmark" size={24} color="#8b5cf6" />
            </View>
            <View>
              <Text style={styles.title}>Admin Panel</Text>
              <Text style={styles.subtitle}>Voice Management</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterBento}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['ALL', 'PUBLIC', 'FRIENDS', 'PRIVATE'].map((f) => (
              <TouchableOpacity
                key={f}
                style={styles.filterButton}
                onPress={() => setFilter(f as any)}
              >
                <Text style={styles.filterText}>{f}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {voices.map(v => (
            <VoiceRow
              key={v.id}
              voice={v}
              onHide={() => hideVoice(v.id)}
              onDelete={() => deleteVoice(v.id)}
            />
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
    marginTop: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterBento: {
    backgroundColor: '#1f1f1f',
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterScroll: {
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#404040',
  },
  filterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
});
