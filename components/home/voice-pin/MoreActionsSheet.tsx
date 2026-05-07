import React, { useState, useMemo } from "react";
import { Modal, View, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform, Share, Dimensions, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BlurView } from "expo-blur";
import { Text } from "@/components/ui/text";
import { useFriends } from "@/hooks/useFriends";
import { Avatar } from "@/components/ui/Avatar";
import { MotiView, AnimatePresence } from "moti";
import { authApis, endpoints } from "@/configs/Apis";
import { MyUserContext } from "@/configs/Context";
import * as Haptics from 'expo-haptics';
import { useContext } from "react";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MoreActionsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  pin: any;
  isOwner: boolean;
  onDelete: () => void;
  onReport: () => void;
  onNotInterested: () => void;
  onShareToUser: () => void;
  onAddToAlbum: () => void;
  theme: any;
}

export function MoreActionsSheet({
  isVisible,
  onClose,
  pin,
  isOwner,
  onDelete,
  onReport,
  onNotInterested,
  onShareToUser,
  onAddToAlbum,
  theme
}: MoreActionsSheetProps) {
  const currentTheme = theme;
  const isDark = currentTheme.colors.background === "#0a0a14" || currentTheme.colors.text === "#f1f5f9";
  const { friends } = useFriends();
  const currentUser = useContext(MyUserContext);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingToId, setSendingToId] = useState<number | null>(null);

  const filteredFriends = useMemo(() => {
    // 1. Filter out self just in case
    const otherFriends = friends.filter(f => f.id !== currentUser?.id);
    
    if (!searchQuery) return otherFriends;
    return otherFriends.filter(f => 
      f.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [friends, searchQuery, currentUser]);

  const generateSlug = (text: string) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/([^0-9a-z-\s])/g, "")
      .replace(/(\s+)/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);
  };

  const handleCopyLink = async () => {
    const slugContent = pin.content || pin.emotionLabel || "whisper";
    const slug = generateSlug(slugContent);
    const link = `https://whispery.app/voice/${slug ? slug + "-" : ""}${pin.id}`;
    try {
      await Share.share({
        message: `Nghe thử VoicePin này trên Whispery nhé: ${link}`,
      });
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadImage = async () => {
    try {
      const imageUrl = pin.images?.[0]?.imageUrl || pin.imageUrl;
      if (!imageUrl) {
        Alert.alert("Lỗi", "Không tìm thấy ảnh để tải về.");
        return;
      }

      const fileUri = FileSystem.cacheDirectory + `whisper_pin_${pin.id}.jpg`;
      const downloadRes = await FileSystem.downloadAsync(imageUrl, fileUri);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        Alert.alert("Lỗi", "Tính năng chia sẻ không khả dụng trên thiết bị này.");
      }
      onClose();
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Lỗi", "Không thể tải ảnh về. Vui lòng thử lại.");
    }
  };

  const handleShareToFriend = async (friend: any) => {
    if (sendingToId) return;
    
    setSendingToId(friend.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const slugContent = pin.content || pin.emotionLabel || "whisper";
      const slug = generateSlug(slugContent);
      const link = `https://whispery.app/voice/${slug ? slug + "-" : ""}${pin.id}?lat=${pin.latitude}&lng=${pin.longitude}`;
      
      const api = authApis();
      // 1. Get or create private chat room
      const roomRes = await api.post(endpoints.chatPrivate(friend.id));
      const roomId = roomRes.data?.data?.id;
      
      if (!roomId) throw new Error("Could not create chat room");

      // 2. Send message with PIN type
      await api.post(endpoints.chatSend(roomId), {
        content: link,
        type: 'PIN',
      });

      // Wait a bit for the animation to play
      setTimeout(() => {
        setSendingToId(null);
        Alert.alert("Thành công", `Đã gửi bài đăng cho ${friend.displayName || friend.username}`);
        onClose();
      }, 800);
      
    } catch (error) {
      console.error("Share error:", error);
      setSendingToId(null);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.");
    }
  };

  const mainActions = [
    {
      key: 'copy_link',
      label: 'Sao chép',
      icon: 'link',
      onPress: handleCopyLink,
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
      color: '#3b82f6'
    },
    {
      key: 'download_image',
      label: 'Tải ảnh',
      icon: 'download',
      onPress: handleDownloadImage,
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
      color: '#10b981'
    },
    {
      key: 'add_to_album',
      label: 'Bộ sưu tập',
      icon: 'library',
      onPress: onAddToAlbum,
      bg: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
      color: '#8b5cf6'
    },
  ];

  const secondaryActions = [];
  
  if (!isOwner) {
    secondaryActions.push(
      {
        key: 'not_interested',
        label: 'Ẩn bài',
        icon: 'eye-off',
        onPress: onNotInterested,
        bg: isDark ? 'rgba(100, 116, 139, 0.15)' : 'rgba(100, 116, 139, 0.1)',
        color: '#64748b'
      },
      {
        key: 'report',
        label: 'Báo cáo',
        icon: 'flag',
        onPress: onReport,
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444'
      }
    );
  } else {
    secondaryActions.push({
      key: 'delete',
      label: 'Xóa bài',
      icon: 'trash',
      onPress: onDelete,
      bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444'
    });
  }

  const ActionItem = ({ action }: { action: any }) => (
    <TouchableOpacity
      key={action.key}
      style={styles.actionItem}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: action.bg }]}>
        <BlurView intensity={isDark ? 20 : 40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        <Ionicons name={action.icon as any} size={24} color={action.color} />
      </View>
      <Text style={[styles.actionLabel, { color: isDark ? '#E2E8F0' : '#1E293B', fontWeight: '600' }]} numberOfLines={1}>
        {action.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        
        <View style={[styles.modalSheet, { backgroundColor: isDark ? '#121212' : '#FFFFFF' }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.modalDragHandle, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827', fontWeight: '800' }]}>Tùy chọn bài đăng</Text>
          </View>
          
          {friends.length > 0 && (
            <View style={styles.friendsSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B', fontWeight: '700' }]}>Gửi cho bạn bè</Text>
                <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}>
                  <Ionicons name="search" size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  <TextInput
                    style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#111827' }]}
                    placeholder="Tìm kiếm..."
                    placeholderTextColor={isDark ? '#4A5568' : '#A0AEC0'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {filteredFriends.map(friend => (
                  <TouchableOpacity 
                    key={friend.id} 
                    style={styles.friendItem}
                    onPress={() => handleShareToFriend(friend)}
                    disabled={sendingToId !== null}
                  >
                    <View>
                      <Avatar uri={friend.avatar} size={56} />
                      <AnimatePresence>
                        {sendingToId === friend.id && (
                          <MotiView
                            from={{ opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: '0deg' }}
                            animate={{ 
                              opacity: 0, 
                              translateX: 150, 
                              translateY: -200, 
                              scale: 0.5,
                              rotate: '45deg' 
                            }}
                            transition={{ 
                              type: 'spring', 
                              damping: 15, 
                              mass: 0.8,
                              stiffness: 100 
                            }}
                            style={styles.paperPlaneOverlay}
                          >
                            <Ionicons name="paper-plane" size={24} color="#8b5cf6" />
                          </MotiView>
                        )}
                      </AnimatePresence>
                    </View>
                    <Text style={[styles.friendName, { color: isDark ? '#E2E8F0' : '#1E293B' }]} numberOfLines={1}>
                      {friend.displayName || friend.username}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]} />
            </View>
          )}

          <View style={styles.scrollSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B', fontWeight: '700' }]}>Chia sẻ</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {mainActions.map(action => <ActionItem key={action.key} action={action} />)}
            </ScrollView>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]} />

          <View style={styles.scrollSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#94A3B8' : '#64748B', fontWeight: '700' }]}>Hành động khác</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {secondaryActions.map(action => <ActionItem key={action.key} action={action} />)}
            </ScrollView>
          </View>
          
          <TouchableOpacity
            style={[styles.modalCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }]}
            onPress={onClose}
          >
            <Text style={[styles.modalCloseText, { color: isDark ? '#FFFFFF' : '#111827', fontWeight: '800' }]}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 99999,
  },
  modalSheet: {
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalHeader: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  modalDragHandle: {
    width: 42,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    letterSpacing: -0.4,
  },
  friendsSection: {
    paddingVertical: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 24,
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    width: 140,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    paddingLeft: 6,
    paddingVertical: 0,
    fontFamily: 'Quicksand_600SemiBold',
  },
  friendItem: {
    alignItems: 'center',
    width: 76,
    marginHorizontal: 4,
  },
  friendName: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
    width: '100%',
  },
  scrollSection: {
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 11,
    paddingHorizontal: 28,
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  horizontalScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  actionItem: {
    alignItems: 'center',
    width: 90,
    marginHorizontal: 4,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  actionLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    marginHorizontal: 28,
    marginVertical: 14,
  },
  modalCloseBtn: {
    marginTop: 20,
    marginHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
  },
  paperPlaneOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 100,
  },
});
