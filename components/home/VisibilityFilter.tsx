import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeOutUp,
  Layout,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors, palette } from '@/constants/Colors';
import {
  Visibility,
  VISIBILITY_LABEL,
  VISIBILITY_LIST,
} from '@/types';

const VISIBILITY_ICON: Record<Visibility, keyof typeof Ionicons.glyphMap> = {
  PUBLIC: 'earth-outline',
  FRIENDS: 'people-outline',
  PRIVATE: 'lock-closed-outline',
};

type Props = {
  value: Visibility;
  onChange: (v: Visibility) => void;
};

import { useColorScheme } from 'react-native';
import { theme } from '@/constants/Theme';

export default function VisibilityFilter({ value, onChange }: Props) {
  const colorScheme = useColorScheme() || 'light';
  const currentTheme = theme[colorScheme];
  const [isOpen, setIsOpen] = useState(false);
  const scale = useSharedValue(1);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    scale.value = withSpring(isOpen ? 1 : 0.95);
  };

  const handleSelect = (v: Visibility) => {
    onChange(v);
    setIsOpen(false);
    scale.value = withSpring(1);
  };

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.filterContainer}>
      <Animated.View style={[styles.mainButtonWrapper, animatedButtonStyle, { shadowColor: currentTheme.colors.primary }]}>
        <TouchableOpacity activeOpacity={0.8} onPress={toggleOpen}>
          <LinearGradient
            colors={[currentTheme.colors.primary, currentTheme.colors.primary + 'CC', currentTheme.colors.primary + '99']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.triggerButton}
          >
            <Ionicons
              name={VISIBILITY_ICON[value]}
              size={18}
              color={Colors.white}
              style={{ marginRight: currentTheme.spacing.xs }}
            />
            <Text style={styles.triggerText}>
              {VISIBILITY_LABEL[value]}
            </Text>
            <Ionicons
              name={isOpen ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={Colors.white}
              style={{ marginLeft: currentTheme.spacing.xs }}
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />

          <View style={[styles.menuContainer, { backgroundColor: currentTheme.colors.background + 'E6', borderRadius: currentTheme.radius.xl }]}>
            {VISIBILITY_LIST.map((v, index) => (
              <Animated.View
                key={v}
                entering={FadeInDown.delay(index * 100).springify().damping(12)}
                exiting={FadeOutUp}
              >
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    { borderRadius: currentTheme.radius.md },
                    value === v && { backgroundColor: currentTheme.colors.primary + '1A' }
                  ]}
                  onPress={() => handleSelect(v)}
                >
                  <View style={[
                    styles.iconCircle,
                    { borderRadius: currentTheme.radius.full },
                    value === v && { backgroundColor: currentTheme.colors.primary }
                  ]}>
                    <Ionicons
                      name={VISIBILITY_ICON[v]}
                      size={20}
                      color={value === v ? Colors.white : currentTheme.colors.primary + 'B3'}
                    />
                  </View>
                  <Text style={[
                    styles.optionText,
                    value === v && { color: currentTheme.colors.text }
                  ]}>
                    {VISIBILITY_LABEL[v]}
                  </Text>
                  {value === v && (
                    <Ionicons name="checkmark-circle" size={20} color={currentTheme.colors.primary} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filterContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1001,
  },
  mainButtonWrapper: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.light.spacing.sm + 2,
    paddingHorizontal: theme.light.spacing.md,
    borderRadius: theme.light.radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  triggerText: {
    color: Colors.white,
    fontSize: theme.light.typography.fontSizes.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    width: '80%',
    padding: theme.light.spacing.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.light.spacing.md - 2,
    marginVertical: theme.light.spacing.xs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.light.spacing.md,
  },
  optionText: {
    flex: 1,
    color: '#999',
    fontSize: theme.light.typography.fontSizes.md,
    fontWeight: '600',
  },
});
