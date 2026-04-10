import { View, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  
  // Height of the visible tab bar content
  const tabHeight = 65;
  // Dynamic padding for Android/iOS safe areas
  const paddingBottom = Platform.OS === 'android' ? Math.max(insets.bottom, 12) : insets.bottom;

  return (
    <View style={[styles.container, { height: tabHeight + paddingBottom }]}>
      {/* Perfect math: Center of the screen is 0.5 * width. 
          The curve spans from 38% to 62% of the width to perfectly orbit the center tab (40%-60%). */}
      <Svg width={width} height={tabHeight + paddingBottom} style={styles.svgBackground}>
        <Path
          fill="white"
          d={`
            M 0,0 
            L ${width * 0.38},0 
            C ${width * 0.42},0 ${width * 0.44},32 ${width * 0.5},32 
            C ${width * 0.56},32 ${width * 0.58},0 ${width * 0.62},0 
            L ${width},0 
            L ${width},${tabHeight + paddingBottom} 
            L 0,${tabHeight + paddingBottom} 
            Z
          `}
        />
      </Svg>

      <View style={[styles.content, { height: tabHeight }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity 
              key={index} 
              onPress={onPress} 
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              {index === 2 ? (
                <View style={styles.centerButtonContainer}>
                  <View style={[styles.centerButton, isFocused && styles.centerButtonActive]}>
                    <Ionicons 
                      name={isFocused ? "compass" : "compass-outline"} 
                      size={32} 
                      color="white" 
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.iconWrapper}>
                  <Ionicons 
                    name={getIconName(route.name, isFocused) as any} 
                    size={26} 
                    color={isFocused ? "#000" : "#A0A0A0"} 
                  />
                  {isFocused && <View style={styles.activeDot} />}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const getIconName = (routeName: string, isFocused: boolean) => {
  const name = routeName.split('/')[0];
  switch (name) {
    case 'home': return isFocused ? 'home' : 'home-outline';
    case 'memory': return isFocused ? 'planet' : 'planet-outline';
    case 'album': return isFocused ? 'library' : 'library-outline';
    case 'profile': return isFocused ? 'person' : 'person-outline';
    case 'store': return isFocused ? 'storefront' : 'storefront-outline';
    case 'notification': return isFocused ? 'notifications' : 'notifications-outline';
    default: return 'square';
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: width,
    backgroundColor: 'transparent',
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    width: width,
  },
  tabItem: {
    flex: 1, // Crucial: Each tab takes EXACTLY 20% of the screen
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButtonContainer: {
    paddingBottom: 25, // Moves the button up into the SVG curve
  },
  centerButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  centerButtonActive: {
    backgroundColor: '#000', // You can change this to a brand color if wanted
    borderColor: '#f8fafc',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  activeDot: {
    width: 18,
    height: 3,
    backgroundColor: '#000',
    borderRadius: 2,
    marginTop: 4,
    position: 'absolute',
    bottom: 10,
  }
});

export default CustomTabBar;
