import { useState } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "@/configs/Apis";

export function useVoicePinReport(pinId: number) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const handleReport = async (reason: string) => {
    setReportLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Thông báo', 'Bạn cần đăng nhập để báo cáo.');
        return;
      }
      const api = authApis(token);
      await api.post(endpoints.submitReport, { voicePinId: pinId, reason });
      setHasReported(true);
      setShowReportModal(false);
      Alert.alert('Cảm ơn!', 'Báo cáo của bạn đã được ghi nhận. Chúng tôi sẽ xem xét sớm nhất.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Không thể gửi báo cáo. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setReportLoading(false);
    }
  };

  return {
    showReportModal,
    setShowReportModal,
    reportLoading,
    hasReported,
    handleReport,
  };
}
