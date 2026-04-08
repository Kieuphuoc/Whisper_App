import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AttachmentCardProps {
    type?: 'pdf' | 'doc';
    label?: string;
}

const AttachmentCard: React.FC<AttachmentCardProps> = ({ type = 'pdf', label = 'Chat Files' }) => {
    const isPdf = type === 'pdf';

    return (
        <TouchableOpacity className="flex-row items-center bg-white/80 p-3 rounded-2xl border border-gray-100 shadow-sm mt-3 self-end min-w-[140px]">
            <View className={`w-8 h-8 ${isPdf ? 'bg-red-50' : 'bg-blue-50'} rounded-lg items-center justify-center mr-3`}>
                <Ionicons 
                    name={isPdf ? "document-outline" : "document-text-outline"} 
                    size={16} 
                    color={isPdf ? "#ef4444" : "#3b82f6"} 
                />
            </View>
            <View>
                <Text className="text-gray-900 font-medium text-xs">{label}</Text>
                <Text className="text-gray-400 text-[10px]">Tap to view</Text>
            </View>
        </TouchableOpacity>
    );
};

export default AttachmentCard;
