/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#7ea000';
const tintColorDark = '#fff';

export const palette = {
  green: {
    100: '#f1f6e0',
    200: '#e2ecc1',
    300: '#cedea2',
    400: '#aec565',
    500: '#7ea000',
    600: '#6a8b00',
    700: '#556f00',
    800: '#425500',
    900: '#334200',
  },
  pink: {
    100: '#fcecef',
    200: '#f9d9df',
    300: '#f4b2bf',
    400: '#ed8499',
    500: '#de3c5f',
    600: '#c12d4d',
    700: '#a4233e',
    800: '#861c31',
    900: '#6b1527',
  }
};

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
  primary: palette.green[500],
  secondary: palette.pink[500],
  background: 'rgba(255,255,255,0.1)',
  cardBackground: 'rgba(30, 30, 47, 0.6)',
  white: '#FFFFFF',
  black: '#000000',
  lightText: '#D1D1E9',
  accent: palette.pink[300],
  shadow: '#00000080',
};
