import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width, height } = Dimensions.get("window");

type Props = {
    visible: boolean;
    onPhotoTaken: (uri: string) => void;
    onSkip: () => void;
};

export default function VoiceCameraCapture({ visible, onPhotoTaken, onSkip }: Props) {
    const cameraRef = useRef<CameraView>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [capturing, setCapturing] = useState(false);

    const handleCapture = async () => {
        if (!cameraRef.current || capturing) return;
        try {
            setCapturing(true);
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.75,
                skipProcessing: false,
            });
            if (photo?.uri) {
                onPhotoTaken(photo.uri);
            }
        } catch (e) {
            console.error("Camera capture failed:", e);
        } finally {
            setCapturing(false);
        }
    };

    if (!visible) return null;

    // Permission loading
    if (!permission) {
        return (
            <Modal visible transparent animationType="fade">
                <View style={styles.centeredView}>
                    <ActivityIndicator color="#fff" size="large" />
                </View>
            </Modal>
        );
    }

    // Permission denied
    if (!permission.granted) {
        return (
            <Modal visible transparent animationType="fade">
                <View style={styles.centeredView}>
                    <Ionicons name="camera-outline" size={48} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.permText}>Cần quyền máy ảnh</Text>
                    <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                        <Text style={styles.permBtnText}>Cho phép Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.skipLink} onPress={onSkip}>
                        <Text style={styles.skipLinkText}>Bỏ qua ảnh</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible statusBarTranslucent animationType="fade">
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <View style={styles.container}>

                {/* Full-screen camera */}
                <CameraView
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    facing="back"
                />

                {/* Vignette overlays */}
                <View style={styles.topGradient} pointerEvents="none" />
                <View style={styles.bottomGradient} pointerEvents="none" />

                {/* Top bar — skip only */}
                <View style={styles.topBar}>
                    <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
                        <Text style={styles.skipText}>Bỏ qua</Text>
                    </TouchableOpacity>
                </View>

                {/* Philosophical text */}
                <View style={styles.mottoContainer} pointerEvents="none">
                    <Text style={styles.mottoText}>
                        "Ảnh này để nhớ,{"\n"}không phải để đẹp"
                    </Text>
                </View>

                {/* Bottom controls — shutter only */}
                <View style={styles.bottomBar}>
                    <View style={styles.sideSlot} />

                    <TouchableOpacity
                        style={styles.shutterOuter}
                        onPress={handleCapture}
                        activeOpacity={0.8}
                        disabled={capturing}
                    >
                        <View style={[styles.shutterInner, capturing && { opacity: 0.5 }]}>
                            {capturing && <ActivityIndicator color="#fff" size="small" />}
                        </View>
                    </TouchableOpacity>

                    <View style={styles.sideSlot} />
                </View>

            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    centeredView: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
    },
    permText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "600",
        marginTop: 12,
    },
    permBtn: {
        backgroundColor: "#8b5cf6",
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 30,
    },
    permBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
    },
    skipLink: {
        marginTop: 8,
        padding: 8,
    },
    skipLinkText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 14,
    },
    topGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 140,
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    bottomGradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        backgroundColor: "rgba(0,0,0,0.55)",
    },
    topBar: {
        position: "absolute",
        top: 56,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    skipBtn: {
        backgroundColor: "rgba(255,255,255,0.12)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    skipText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
    mottoContainer: {
        position: "absolute",
        bottom: 160,
        left: 0,
        right: 0,
        alignItems: "center",
        paddingHorizontal: 32,
    },
    mottoText: {
        color: "rgba(255,255,255,0.85)",
        fontSize: 16,
        fontWeight: "300",
        fontStyle: "italic",
        textAlign: "center",
        lineHeight: 24,
        letterSpacing: 0.3,
    },
    bottomBar: {
        position: "absolute",
        bottom: 56,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 40,
    },
    sideSlot: {
        width: 56,
    },
    shutterOuter: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "transparent",
        borderWidth: 4,
        borderColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
    },
    shutterInner: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: "#fff",
        justifyContent: "center",
        alignItems: "center",
    },
});
