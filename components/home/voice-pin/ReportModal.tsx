import React from "react";
import { Modal, View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { REPORT_REASONS } from "./VoicePinConstants";

interface ReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  onReport: (reason: string) => void;
  reportLoading: boolean;
  theme: any;
}

export function ReportModal({ isVisible, onClose, onReport, reportLoading, theme }: ReportModalProps) {
  const currentTheme = theme;
  
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.border }]}>
          <View style={styles.modalHeader}>
            <View style={styles.modalDragHandle} />
          </View>
          <Text style={[styles.modalTitle, { color: currentTheme.colors.text }]}>Báo cáo vi phạm</Text>
          <Text style={[styles.modalSubtitle, { color: currentTheme.colors.textMuted }]}>
            Chọn lý do báo cáo bài đăng này:
          </Text>
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {REPORT_REASONS.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.reportReasonBtn, { backgroundColor: currentTheme.colors.surfaceAlt, borderColor: currentTheme.colors.border }]}
                onPress={() => {
                  Alert.alert(
                    'Xác nhận báo cáo',
                    `Bạn muốn báo cáo bài đăng này vì "${r.label}"?`,
                    [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Báo cáo', style: 'destructive', onPress: () => onReport(r.key) }
                    ]
                  );
                }}
                disabled={reportLoading}
                activeOpacity={0.7}
              >
                <Ionicons name={r.icon} size={20} color="#ef4444" style={{ marginRight: 12 }} />
                <Text style={[styles.reportReasonText, { color: currentTheme.colors.text }]}>{r.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={currentTheme.colors.textMuted} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalCancelBtn, { borderColor: currentTheme.colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.modalCancelText, { color: currentTheme.colors.textSecondary }]}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748b55',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 14,
  },
  reportReasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  reportReasonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalCancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
