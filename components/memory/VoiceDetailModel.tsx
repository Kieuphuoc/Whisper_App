import { VoicePin } from '@/types';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  visible: boolean;
  data: VoicePin | null;
  onClose: () => void;
  onShowMap: () => void;
};

export function VoiceDetailModal({
  visible,
  data,
  onClose,
  onShowMap,
}: Props) {
  if (!data) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <Text style={styles.title}>{data.content}</Text>
        <Text>{data.emotionLabel}</Text>
        <Text>{data.address}</Text>

        <TouchableOpacity style={styles.btn} onPress={onShowMap}>
          <Text>Xem trên bản đồ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={onClose}>
          <Text>Đóng</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  title: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 12,
  },
  btn: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#222',
    borderRadius: 8,
    alignItems: 'center',
  },
});
