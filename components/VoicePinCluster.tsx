import { MyUserContext } from '@/configs/Context';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type VoicePin = {
  id: string;
  latitude: number;
  longitude: number;
  emotion: string;
  description: string;
  duration: number;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  audioUrl: string;
  imageUrl?: string;
  address?: string;
  createdAt: string;
  user?: {
    displayName: string;
    username: string;
    avatar?: string;
  };
  likes?: number;
  replies?: number;
};

type VoicePinClusterProps = {
  voicePins: VoicePin[];
  latitude: number;
  longitude: number;
  onPress: (voicePin: VoicePin) => void;
};

export default function VoicePinCluster({ voicePins, latitude, longitude, onPress }: VoicePinClusterProps) {
  const [showClusterModal, setShowClusterModal] = useState(false);

  const handleClusterPress = () => {
    if (voicePins.length === 1) {
      onPress(voicePins[0]);
    } else {
      setShowClusterModal(true);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const user = useContext(MyUserContext);


  return (
    <>
      <TouchableOpacity onPress={handleClusterPress} style={styles.clusterContainer}>
        <View style={styles.clusterBackground}>
          <Ionicons name="mic" size={16} color="#ffffff" />
          {voicePins.length > 1 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{voicePins.length}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={showClusterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClusterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Voice Pin here! ({voicePins.length})</Text>
              <TouchableOpacity
                onPress={() => setShowClusterModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.voiceList} showsVerticalScrollIndicator={false}>
              {voicePins.map((voicePin, index) => (
                <TouchableOpacity
                  key={voicePin.id}
                  style={styles.voiceItem}
                  onPress={() => {
                    setShowClusterModal(false);
                    onPress(voicePin);
                  }}
                >
                  <View style={styles.voiceItemHeader}>
                    <View style={styles.userInfo}>
                      {voicePin.user?.avatar ? (
                        <Image source={{ uri: voicePin.user.avatar }} style={styles.userAvatar} />
                      ) : (
                        <View style={styles.defaultAvatar}>
                          <Ionicons name="person" size={16} color={Colors.primary} />
                        </View>
                      )}
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{voicePin.user?.displayName || 'Anonymous'}</Text>
                        <Text style={styles.timestamp}>{formatTime(voicePin.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={styles.emotionContainer}>
                      <Text style={styles.emotionText}>{voicePin.emotion}</Text>
                    </View>
                  </View>

                  <Text style={styles.description} numberOfLines={2}>
                    {voicePin.description}
                  </Text>

                  <View style={styles.voiceStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="heart-outline" size={14} color="#6b7280" />
                      <Text style={styles.statText}>{voicePin.likes || 0}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble-outline" size={14} color="#6b7280" />
                      <Text style={styles.statText}>{voicePin.replies || 0}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="time-outline" size={14} color="#6b7280" />
                      <Text style={styles.statText}>{voicePin.duration}s</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  clusterContainer: {
    alignItems: 'center',
  },
  clusterBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  countText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceList: {
    maxHeight: 400,
  },
  voiceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  voiceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  defaultAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  emotionContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#faf5ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8b5cf6',
  },
  emotionText: {
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  voiceStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});

