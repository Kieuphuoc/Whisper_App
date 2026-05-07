import React from 'react';
import { View, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { theme } from '@/constants/Theme';
import { useRouter } from 'expo-router';

interface SharedVoicePinProps {
  pinId: string | number;
  content?: string;
  isMine: boolean;
  lat?: string | number;
  lng?: string | number;
}

export default function SharedVoicePin({ pinId, content, isMine, lat, lng }: SharedVoicePinProps) {
  const scheme = useColorScheme() || 'light';
  const isDark = scheme === 'dark';
  const currentTheme = theme[scheme];
  const router = useRouter();

  const handlePress = () => {
    // Navigate to the VoicePin detail or map with coordinates
    router.push({
      pathname: '/home',
      params: { 
        selectPinId: pinId.toString(), 
        autoPlay: 'true',
        lat: lat?.toString(),
        lng: lng?.toString()
      }
    });
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.8}
      style={[
        styles.container, 
        { 
          backgroundColor: isMine ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
          borderColor: isMine ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
        }
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: '#8b5cf6' }]}>
          <Ionicons name="mic" size={16} color="white" />
        </View>
        <Text style={[styles.title, { color: isMine ? 'white' : (isDark ? 'white' : '#1e293b') }]}>VoicePin Shared</Text>
      </View>
      
      <Text style={[styles.content, { color: isMine ? 'rgba(255,255,255,0.9)' : (isDark ? 'rgba(255,255,255,0.7)' : '#64748b') }]} numberOfLines={2}>
        {content || "Nhấn để nghe tin nhắn thoại này..."}
      </Text>

      <View style={[styles.footer, { borderTopColor: isMine ? 'rgba(255,255,255,0.1)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') }]}>
        <Text style={[styles.footerText, { color: isMine ? 'rgba(255,255,255,0.7)' : '#8b5cf6' }]}>XEM CHI TIẾT</Text>
        <Ionicons name="chevron-forward" size={12} color={isMine ? 'rgba(255,255,255,0.7)' : '#8b5cf6'} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 12,
    width: 200,
    borderWidth: 1,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
