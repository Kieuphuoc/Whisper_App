import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAudioPlayer } from 'expo-audio';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

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
    name: string;
    avatar?: string;
  };
  likes?: number;
  replies?: number;
};

type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | null;

type Comment = {
  id: string;
  user: { name: string; avatar?: string };
  content: string;
  createdAt: string;
  replies?: Comment[];
};

type RootStackParamList = {
  voiceDetail: { voicePinId: string };
  home: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'voiceDetail'>;



export default function VoiceDetailScreen({ route, navigation }: Props) {
  const { voicePinId } = route.params;
  console.log("Ma chi tiet voice", voicePinId);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Voice Detail: {voicePinId}</Text>
    </View>
  );
}

