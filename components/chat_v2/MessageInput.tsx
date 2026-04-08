import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get("window");

interface MessageInputProps {
    onSend: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend }) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (text.trim()) {
            onSend(text);
            setText('');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.inputWrapper}>
                <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
                    <Ionicons name="add" size={22} color="#4B5563" />
                </TouchableOpacity>
                
                <TextInput 
                    style={styles.input}
                    placeholder="Whisper message..."
                    placeholderTextColor="#9CA3AF"
                    value={text}
                    onChangeText={setText}
                    multiline={false}
                />

                <TouchableOpacity 
                    onPress={handleSend}
                    disabled={!text.trim()}
                    activeOpacity={0.85}
                    style={[
                        styles.sendButton,
                        text.trim() ? styles.sendButtonActive : styles.sendButtonDisabled
                    ]}
                >
                    <Ionicons 
                        name="arrow-up" 
                        size={20} 
                        color={text.trim() ? '#FFFFFF' : '#9CA3AF'} 
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        paddingTop: 8,
        backgroundColor: 'transparent',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: "#0B0F19",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
    },
    attachButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        height: 44,
        color: '#111827',
        paddingHorizontal: 12,
        fontWeight: '500',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    sendButtonActive: {
        backgroundColor: '#111827',
    },
    sendButtonDisabled: {
        backgroundColor: '#F3F4F6',
    },
});

export default MessageInput;

