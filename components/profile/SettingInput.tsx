import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { Text } from '@/components/ui/text';

interface SettingInputProps extends TextInputProps {
    label: string;
    rightElement?: React.ReactNode;
    leftElement?: React.ReactNode;
}

export const SettingInput = ({ label, rightElement, leftElement, style, ...props }: SettingInputProps) => {
    return (
        <View className="mb-6">
            <Text style={{
                fontWeight: '700',
                fontSize: 12,
                color: '#6b7280',
                marginBottom: 8,
                marginLeft: 4,
                textTransform: 'uppercase'
            }}>
                {label}
            </Text>
            <View className="flex-row items-center bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-5 min-h-[56px]">
                {leftElement && (
                    <View className="mr-2 justify-center">
                        {leftElement}
                    </View>
                )}
                <TextInput
                    className="flex-1 py-3 text-gray-700 dark:text-white"
                    placeholderTextColor="#94a3b8"
                    textAlignVertical={props.multiline ? 'top' : 'center'}
                    {...props}
                />

                {rightElement && (
                    <View className="ml-2 justify-center">
                        {rightElement}
                    </View>
                )}
            </View>
        </View>
    );
};
