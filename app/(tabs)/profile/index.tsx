import { authApis, endpoints } from '@/configs/Apis';
import { MyDispatchContext, MyUserContext } from '@/configs/Context';
import { ProfileVoicePin, User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const user = useContext(MyUserContext) as User | null;
  const dispatch = useContext(MyDispatchContext);
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'pins' | 'memories'>('pins');
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<{ voicePinCount: number, totalListens: number, locationCount: number } | null>(null);
  const [voicePins, setVoicePins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.token) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      if (!user?.token) return;
      setLoading(true);
      const api = authApis(user.token);

      const [profileRes, statsRes, pinsRes] = await Promise.all([
        api.get(endpoints.userMe),
        api.get(endpoints.userStats),
        api.get(endpoints.voice)
      ]);

      setProfile(profileRes.data);
      setStats(statsRes.data);
      setVoicePins(pinsRes.data);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const mostPlayedMemories = [...voicePins]
    .sort((a, b) => (b.listensCount || 0) - (a.listensCount || 0))
    .slice(0, 5);

  const VoicePinCard = ({ pin }: { pin: ProfileVoicePin }) => (
    <View style={styles.pinBento}>
      <View style={styles.pinHeader}>
        <View style={styles.pinIconContainer}>
          <Text style={styles.pinEmoji}>{pin.emotion}</Text>
        </View>
        <View style={styles.pinInfo}>
          <Text style={styles.pinTitle}>{pin.title}</Text>
          <Text style={styles.pinLocation}>{pin.location}</Text>
        </View>
        <TouchableOpacity style={styles.playButton}>
          <Ionicons name="play" size={16} color="#8b5cf6" />
        </TouchableOpacity>
      </View>
      <View style={styles.pinStats}>
        <View style={styles.pinStatItem}>
          <Ionicons name="time-outline" size={14} color="#9ca3af" />
          <Text style={styles.pinStatText}>{pin.duration}</Text>
        </View>
        <View style={styles.pinStatItem}>
          <Ionicons name="play-outline" size={14} color="#9ca3af" />
          <Text style={styles.pinStatText}>{pin.playCount}</Text>
        </View>
      </View>
    </View>
  );

  const MemoryCard = ({ memory }: { memory: any }) => (
    <View style={styles.memoryBento}>
      <View style={styles.memoryHeader}>
        <View style={styles.memoryIconContainer}>
          <Text style={styles.memoryEmoji}>{memory.emotion}</Text>
        </View>
        <View style={styles.memoryInfo}>
          <Text style={styles.memoryTitle}>{memory.title}</Text>
          <Text style={styles.memoryDuration}>{memory.duration}</Text>
        </View>
        <View style={styles.playCountContainer}>
          <Text style={styles.playCount}>{memory.playCount}</Text>
          <Text style={styles.playCountLabel}>plays</Text>
        </View>
      </View>
    </View>
  );

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      if (dispatch) {
        dispatch({ type: 'LOGOUT' });
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#8b5cf6" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.settingsButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={20} color="#8b5cf6" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileBento}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }}
              style={styles.profileImage}
            />
            <View style={styles.onlineIndicator} />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.username}>{profile?.displayName || profile?.username || 'User'}</Text>
            <Text style={styles.userBio}>Voice storyteller & memory collector</Text>
            <Text style={styles.userLocation}>San Francisco, CA</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsBento}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.voicePinCount || 0}</Text>
            <Text style={styles.statLabel}>Voice Pins</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.totalListens || 0}</Text>
            <Text style={styles.statLabel}>Total Plays</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats?.locationCount || 0}</Text>
            <Text style={styles.statLabel}>Locations</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsBento}>
          <TouchableOpacity style={styles.following}>
            <Ionicons name="people" size={16} color="#8b5cf6" />
            <Text style={styles.followingText}>Following</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageButton}>
            <Ionicons name="chatbubble-outline" size={16} color="#8b5cf6" />
            <Text style={styles.messageText}>Message</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsBento}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pins' && styles.activeTab]}
            onPress={() => setActiveTab('pins')}
          >
            <Text style={[styles.tabText, activeTab === 'pins' && styles.activeTabText]}>
              Voice Pins
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'memories' && styles.activeTab]}
            onPress={() => setActiveTab('memories')}
          >
            <Text style={[styles.tabText, activeTab === 'memories' && styles.activeTabText]}>
              Most Played
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#8b5cf6" style={{ marginTop: 40 }} />
          ) : activeTab === 'pins' ? (
            <View style={styles.pinsContainer}>
              {voicePins.length > 0 ? (
                voicePins.map((pin) => (
                  <VoicePinCard
                    key={pin.id}
                    pin={{
                      id: pin.id,
                      title: pin.content,
                      emotion: pin.emotionLabel || '🎵',
                      duration: pin.duration ? `${Math.floor(pin.duration / 60)}:${(pin.duration % 60).toString().padStart(2, '0')}` : '0:00',
                      playCount: pin.listensCount || 0,
                      location: pin.address || 'Unknown'
                    }}
                  />
                ))
              ) : (
                <Text style={styles.noDataText}>No voice pins yet</Text>
              )}
            </View>
          ) : (
            <View style={styles.memoriesContainer}>
              {mostPlayedMemories.length > 0 ? (
                mostPlayedMemories.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={{
                      id: memory.id,
                      title: memory.content,
                      emotion: memory.emotionLabel || '🎙️',
                      duration: memory.duration ? `${Math.floor(memory.duration / 60)}:${(memory.duration % 60).toString().padStart(2, '0')}` : '0:00',
                      playCount: memory.listensCount || 0,
                    }}
                  />
                ))
              ) : (
                <Text style={styles.noDataText}>No memories yet</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileBento: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#f8fafc',
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statsBento: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    marginHorizontal: 8,
  },
  actionsBento: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  following: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  followingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  messageText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#8b5cf6',
  },
  tabsBento: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#8b5cf6',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  pinsContainer: {
    gap: 12,
  },
  pinBento: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pinIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  pinEmoji: {
    fontSize: 18,
  },
  pinInfo: {
    flex: 1,
  },
  pinTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  pinLocation: {
    fontSize: 12,
    color: '#64748b',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  pinStats: {
    flexDirection: 'row',
    gap: 16,
  },
  pinStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinStatText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  memoriesContainer: {
    gap: 12,
  },
  memoryBento: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  memoryEmoji: {
    fontSize: 18,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  memoryDuration: {
    fontSize: 12,
    color: '#64748b',
  },
  playCountContainer: {
    alignItems: 'center',
  },
  playCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  playCountLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  noDataText: {
    textAlign: 'center',
    color: '#9ca3af',
    marginTop: 40,
    fontSize: 16,
  },
});
