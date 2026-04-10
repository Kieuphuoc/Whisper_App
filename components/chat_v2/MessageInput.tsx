import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface MessageInputProps {
    onSend: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
    const [text, setText] = useState('');
    const scheme = useColorScheme() || 'light';
    const isDark = scheme === 'dark';

    const handleSend = () => {
        if (text.trim()) {
            onSend(text);
            setText('');
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.inputWrapper, { 
                backgroundColor: isDark ? 'rgba(7,10,21,0.74)' : 'rgba(255,255,255,0.88)',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.94)',
            }]}>
                <BlurView intensity={22} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <LinearGradient
                    colors={isDark ? ['rgba(139,92,246,0.15)', 'transparent'] : ['rgba(139,92,246,0.08)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                <TouchableOpacity style={[styles.attachButton, { backgroundColor: isDark ? 'rgba(139,92,246,0.24)' : 'rgba(139,92,246,0.12)' }]} activeOpacity={0.7}>
                    <Ionicons name="add" size={22} color={isDark ? "rgba(255,255,255,0.9)" : "#4B5563"} />
                </TouchableOpacity>

                <TextInput
                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#111827' }]}
                    placeholder="Phát tín hiệu..."
                    placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#9CA3AF"}
                    value={text}
                    onChangeText={setText}
                    multiline={false}
                />

                <TouchableOpacity
                    onPress={handleSend}
                    disabled={!text.trim()}
                    activeOpacity={0.85}
                    style={styles.sendButton}
                >
                    {text.trim() ? (
                        <LinearGradient
                            colors={['#8b5cf6', '#a78bfa']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.sendButtonActive}
                        >
                            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                        </LinearGradient>
                    ) : (
                        <View style={[styles.sendButtonDisabled, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#EEF2FF' }]}>
                            <Ionicons name="arrow-up" size={20} color={isDark ? 'rgba(255,255,255,0.5)' : '#9CA3AF'} />
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 18,
        paddingTop: 8,
        backgroundColor: 'transparent',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 30,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderWidth: 1.2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
        elevation: 6,
    },
    attachButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15.5,
        height: 44,
        paddingHorizontal: 12,
        fontWeight: '600',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    sendButtonActive: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        width: 40,
        height: 40,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default MessageInput;

