import React, { useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text, Image, StatusBar } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  Easing,
  interpolate,
  withSequence,
  withRepeat
} from 'react-native-reanimated';
import { MotiView, AnimatePresence } from 'moti';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// --- Achievement Images Mapping ---
const ACHIEVEMENT_IMAGES: Record<string, any> = {
  'first_voice': require('@/assets/images/achievements/first_voice.png'),
  'voice_collector': require('@/assets/images/achievements/voice_collector.png'),
  'explorer': require('@/assets/images/achievements/explorer.png'),
  'popular_voice': require('@/assets/images/achievements/popular_voice.png'),
  'social_butterfly': require('@/assets/images/achievements/social_butterfly.png'),
  'commenter': require('@/assets/images/achievements/commenter.png'),
  'mascot': require('@/assets/images/mascot_whispery.png'),
};

// --- Context & Hook ---
interface CelebrationContextType {
  celebrate: (config: CelebrationConfig) => void;
}

interface CelebrationConfig {
  title: string;
  subtitle: string;
  achievementKey?: string; // key for ACHIEVEMENT_IMAGES
  type?: 'achievement' | 'milestone' | 'welcome';
}

const CelebrationContext = createContext<CelebrationContextType | undefined>(undefined);

export const useCelebration = () => {
  const context = useContext(CelebrationContext);
  if (!context) throw new Error('useCelebration must be used within CelebrationProvider');
  return context;
};

// --- Premium Particle (Fireworks) ---
const PARTICLE_COUNT = 50;
const COLORS = ['#8b5cf6', '#a78bfa', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#fff'];

const Sparkle = ({ delay, color }: { delay: number; color: string }) => {
  const startX = width / 2;
  const startY = height / 2;
  
  const angle = Math.random() * Math.PI * 2;
  const velocity = Math.random() * 200 + 100;
  const targetX = startX + Math.cos(angle) * velocity * 1.5;
  const targetY = startY + Math.sin(angle) * velocity * 1.5 + 200; // Gravity effect

  const posX = useSharedValue(startX);
  const posY = useSharedValue(startY);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withDelay(delay, withTiming(1, { duration: 200 })),
      withTiming(0, { duration: 2000 })
    );
    scale.value = withSequence(
      withDelay(delay, withTiming(Math.random() * 1.5 + 0.5, { duration: 300 })),
      withTiming(0, { duration: 1800 })
    );
    posX.value = withDelay(delay, withTiming(targetX, { duration: 2000, easing: Easing.out(Easing.quad) }));
    posY.value = withDelay(delay, withTiming(targetY, { duration: 2000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: posX.value,
    top: posY.value,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color,
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  }));

  return <Animated.View style={animatedStyle} />;
};

// --- Main Provider Component ---
export const CelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeCelebration, setActiveCelebration] = useState<CelebrationConfig | null>(null);
  const [showFireworks, setShowFireworks] = useState(false);

  const celebrate = useCallback((config: CelebrationConfig) => {
    setActiveCelebration(config);
    setShowFireworks(true);
    
    setTimeout(() => {
      setActiveCelebration(null);
      setTimeout(() => setShowFireworks(false), 2000);
    }, 5000);
  }, []);

  const achievementImage = useMemo(() => {
    if (!activeCelebration?.achievementKey) return ACHIEVEMENT_IMAGES.mascot;
    return ACHIEVEMENT_IMAGES[activeCelebration.achievementKey] || ACHIEVEMENT_IMAGES.mascot;
  }, [activeCelebration]);

  return (
    <CelebrationContext.Provider value={{ celebrate }}>
      {children}
      
      <AnimatePresence>
        {activeCelebration && (
          <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            
            {/* Dark Overlay Backdrop */}
            <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            />

            {/* Premium Fireworks */}
            {showFireworks && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
                        <Sparkle key={i} delay={i * 10} color={COLORS[i % COLORS.length]} />
                    ))}
                </View>
            )}

            {/* Achievement Card */}
            <MotiView
              from={{ opacity: 0, scale: 0.85, translateY: 40 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              exit={{ opacity: 0, scale: 1.1, translateY: -20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              style={styles.cardWrapper}
            >
              <BlurView intensity={60} tint="dark" style={styles.glassCard}>
                <LinearGradient
                    colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.02)']}
                    style={StyleSheet.absoluteFill}
                />
                
                <MotiView
                    from={{ scale: 0.5, opacity: 0, rotate: '-10deg' }}
                    animate={{ scale: 1, opacity: 1, rotate: '0deg' }}
                    transition={{ delay: 300, type: 'spring' }}
                    style={styles.imageContainer}
                >
                    <Image 
                        source={achievementImage} 
                        style={styles.achievementImage}
                        resizeMode="contain"
                    />
                </MotiView>

                <View style={styles.content}>
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 500 }}
                        style={styles.badge}
                    >
                        <Text style={styles.badgeText}>MỞ KHÓA THÀNH TỰU</Text>
                    </MotiView>

                    <Text style={styles.title}>{activeCelebration.title}</Text>
                    <Text style={styles.subtitle}>{activeCelebration.subtitle}</Text>
                </View>

                {/* Shimmer Effect */}
                <MotiView
                    from={{ translateX: -width }}
                    animate={{ translateX: width }}
                    transition={{ loop: true, type: 'timing', duration: 2500, delay: 1500 }}
                    style={styles.shimmer}
                >
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </MotiView>
              </BlurView>
            </MotiView>
          </View>
        )}
      </AnimatePresence>
    </CelebrationContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  cardWrapper: {
    width: width * 0.88,
    alignItems: 'center',
  },
  glassCard: {
    width: '100%',
    borderRadius: 40,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  imageContainer: {
    width: 200,
    height: 200,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementImage: {
    width: '100%',
    height: '100%',
  },
  content: {
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Quicksand_700Bold',
    color: '#a78bfa',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Quicksand_700Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Quicksand_500Medium',
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 22,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width * 2,
    height: '100%',
  },
});
