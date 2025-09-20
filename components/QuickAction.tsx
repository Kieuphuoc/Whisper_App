// QuickActions.tsx
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type QuickActionItem = {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
};

export default function QuickAction() {
  const router = useRouter();

  const handleFriendsPress = () => {
    router.push('/(home)/listfriend');
  };

  const handleExplorePress = () => {
    // TODO: Navigate to explore page
    console.log('Explore pressed');
  };

  const actions: QuickActionItem[] = [
    { iconName: 'compass', label: 'Explore', onPress: handleExplorePress },
    { iconName: 'people', label: 'Friends', onPress: handleFriendsPress },
  ];

  return (
    <View style={styles.quickActionsBento}>
      {actions.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={styles.quickActionButton}
          onPress={item.onPress}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name={item.iconName} size={20} color={Colors.primary}/>
          </View>
          <Text style={styles.quickActionText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  quickActionsBento: {
    position: 'absolute',
    top: 140,
    left: 16,
    backgroundColor: Colors.button,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.1)',
  },
  quickActionButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 0,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(205, 188, 250, 0.26)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 10,
    color: Colors.lightText,
    fontWeight: '500',
  },
});
