/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  button: '#1A1A1A',
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  primary: '#8b5cf6',
  secondary: '#3D2C8D',
  background: 'rgba(255,255,255,0.1)', // opacity nhẹ
  cardBackground: 'rgba(30, 30, 47, 0.6)',
  white: '#FFFFFF',
  black: '#000000',
  lightText: '#D1D1E9',
  accent: '#B983FF',
  shadow: '#00000080',
};
