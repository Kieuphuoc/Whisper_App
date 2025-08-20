import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface UserProfileScreenProps {
  onBack: () => void;
}

export default function UserProfileScreen({ onBack }: UserProfileScreenProps) {

  const mockUser = {
    username: 'VoiceExplorer',
    joinDate: new Date('2023-08-15'),
    totalVoices: 47,
    followers: 234,
    following: 156,
    publicPins: [
      { id: '1', emotion: '😊', location: 'Central Park, NY', note: 'Morning jog vibes!', likes: 15 },
      { id: '2', emotion: '🎵', location: 'Coffee Shop, SF', note: 'Jazz music inspiration', likes: 8 },
      { id: '3', emotion: '🌅', location: 'Golden Gate Bridge', note: 'Sunrise meditation', likes: 23 },
      { id: '4', emotion: '📚', location: 'Library, Boston', note: 'Study session thoughts', likes: 5 },
      { id: '5', emotion: '🎉', location: 'Times Square, NY', note: 'New Year celebration!', likes: 31 }
    ]
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <View style={styles.arrow}></View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Avatar & Info */}
        <View style={styles.centerAlign}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {mockUser.username.charAt(0)}
            </Text>
          </View>
          <Text style={styles.username}>{mockUser.username}</Text>
          <Text style={styles.joinDate}>
            Joined {mockUser.joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[
              { label: 'Voices', value: mockUser.totalVoices },
              { label: 'Followers', value: mockUser.followers },
              { label: 'Following', value: mockUser.following }
            ].map((stat) => (
              <View style={styles.statItem} key={stat.label}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={
               styles.following 
              }
            >
              <Text>Following
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
        >
          <Text style={[styles.tabText && styles.activeTabText]}>Public Pins</Text>
        </TouchableOpacity>
        <TouchableOpacity
        >
          <Text style={[styles.tabText && styles.activeTabText]}>Most Listened</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.contentContainer}>
         
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 16, backgroundColor: '#f0fdf4' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', elevation: 3
  },
  arrow: {
    width: 12, height: 12, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: '#4b5563',
    transform: [{ rotate: '45deg' }]
  },
  headerTitle: { fontSize: 20, fontWeight: '600' },
  centerAlign: { alignItems: 'center' },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 12
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  username: { fontSize: 20, fontWeight: '600', marginBottom: 4 },
  joinDate: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 20, color: '#16a34a', fontWeight: '600' },
  statLabel: { color: '#6b7280', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 12 },
  followButton: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20, borderWidth: 2 },
  notFollowing: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  following: { backgroundColor: '#e5e7eb', borderColor: '#d1d5db' },
  notFollowingText: { color: '#fff', fontWeight: '500' },
  followingText: { color: '#374151', fontWeight: '500' },
  messageButton: {
    paddingVertical: 8, paddingHorizontal: 24, borderRadius: 20,
    borderColor: '#22c55e', borderWidth: 2, backgroundColor: '#fff'
  },
  messageButtonText: { color: '#22c55e', fontWeight: '500' },
  tabsRow: {
    flexDirection: 'row', margin: 16, backgroundColor: '#f3f4f6',
    borderRadius: 16, padding: 4
  },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  activeTab: { backgroundColor: '#fff', elevation: 2 },
  tabText: { color: '#6b7280', fontSize: 14 },
  activeTabText: { color: '#22c55e', fontWeight: '600' },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  pinRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center'
  },
  pinIconText: { color: '#fff', fontSize: 20 },
  noteText: { fontSize: 16, color: '#111827', marginBottom: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  locationText: { fontSize: 13, color: '#6b7280' },
  likesText: { fontSize: 13, color: '#ef4444' },
  rankBadge: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 6
  },
  rankText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
