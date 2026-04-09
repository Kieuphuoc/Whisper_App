import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText } from 'moti';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Chào mừng đến với Whisper',
    description: 'Lắng nghe những tiếng lòng thầm kín và những câu chuyện chưa kể từ khắp mọi nơi xung quanh bạn.',
    icon: 'mic-outline',
    colors: ['#8b5cf6', '#6d28d9'],
  },
  {
    id: '2',
    title: 'Ghi lại VoicePins',
    description: 'Lưu giữ những khoảnh khắc tuyệt vời của bạn bằng âm thanh và gắn chúng vào những địa điểm đặc biệt.',
    icon: 'location-outline',
    colors: ['#ec4899', '#be185d'],
  },
  {
    id: '3',
    title: 'Khám phá AR',
    description: 'Tìm kiếm và khám phá những thông điệp ẩn giấu xung quanh bạn thông qua lăng kính thực tế ảo tăng cường.',
    icon: 'scan-outline',
    colors: ['#06b6d4', '#0891b2'],
  },
  {
    id: '4',
    title: 'Kết nối Cảm xúc',
    description: 'Chia sẻ những tâm tư và gắn kết với bạn bè thông qua thế giới âm thanh sống động.',
    icon: 'heart-outline',
    colors: ['#f59e0b', '#d97706'],
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(auth)/login');
    } catch (e) {
      console.error('Error saving onboarding state:', e);
    }
  };

  const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
    return (
      <View style={styles.slide}>
        <MotiView
          from={{ opacity: 0, scale: 0.5, translateY: 50 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', duration: 1000, delay: 200 }}
          style={styles.iconContainer}
        >
          <LinearGradient
            colors={item.colors as [string, string, ...string[]]}
            style={styles.gradientIcon}
          >
            <Ionicons name={item.icon as any} size={80} color="#fff" />
          </LinearGradient>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 400 }}
          style={styles.textContainer}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </MotiView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
        ref={slidesRef}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>

        <View style={styles.pagination}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: SLIDES[currentIndex].colors[0] }]}
                key={i.toString()}
              />
            );
          })}
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: SLIDES[currentIndex].colors[0] }]} 
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Khám phá ngay' : 'Tiếp tục'}
          </Text>
        </TouchableOpacity>

        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={completeOnboarding} style={styles.skipButton}>
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconContainer: {
    marginBottom: 60,
  },
  gradientIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    height: height * 0.25,
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  pagination: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  button: {
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Quicksand_700Bold',
  },
  skipButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  skipText: {
    color: '#94a3b8',
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
  },
});
