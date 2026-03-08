// @ts-check
/**
 * Design Token System — Single Source of Truth
 * 
 * Feeds into:
 *   - tailwind.config.js  → NativeWind className
 *   - constants/Colors.ts → JS/StyleSheet values
 */

// ─────────────────────────────────────────
// COLOR PALETTE
// ─────────────────────────────────────────
const palette = {
  purple: {
    50:  '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  pink: {
    50: '#fff0f3',
    100: '#fcecef',
    200: '#f9d9df',
    300: '#f4b2bf',
    400: '#ed8499',
    500: '#de3c5f',
    600: '#c12d4d',
    700: '#a4233e',
    800: '#861c31',
    900: '#6b1527',
  },
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  green: {
    500: '#22c55e',
    600: '#16a34a',
  },
  red: {
    500: '#ef4444',
    600: '#dc2626',
  },
  yellow: {
    500: '#eab308',
    600: '#ca8a04',
  },
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// ─────────────────────────────────────────
// 🌗 SEMANTIC COLORS (Light / Dark)
// ─────────────────────────────────────────
const semantic = {
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    overlay: 'rgba(0,0,0,0.4)',
    primary: '#8b5cf6',
  },
  dark: {
    background: '#0a0a14',
    surface: '#111118',
    surfaceAlt: '#1a1a2e',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: '#1e293b',
    borderStrong: '#334155',
    overlay: 'rgba(0,0,0,0.6)',
    primary: '#a78bfa',
  },
};

// ─────────────────────────────────────────
// 📏 SPACING
// ─────────────────────────────────────────
const spacing = {
  // Numeric (Tailwind-style)
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
  // Named aliases (dùng trong JS như theme.spacing.lg)
  xs:    4,
  sm:    8,
  md:    16,
  lg:    24,
  xl:    32,
  '2xl': 40,
  '3xl': 48,
};

// ─────────────────────────────────────────
// 🔤 TYPOGRAPHY
// ─────────────────────────────────────────
const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// ─────────────────────────────────────────
// 🔲 BORDER RADIUS
// ─────────────────────────────────────────
const borderRadius = {
  none: 0,
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
  // Semantic
  card: 16,
  btn: 24,
  input: 12,
  avatar: 9999,
};

// ─────────────────────────────────────────
// 📦 SHADOW
// ─────────────────────────────────────────
const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 10,
  },
  primary: {
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
};

// ─────────────────────────────────────────
// 🎞 ANIMATION DURATION (ms)
// ─────────────────────────────────────────
const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  // Easing functions
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: {
      soft: { tension: 20, friction: 7 },
      stiff: { tension: 50, friction: 10 },
    }
  }
};

const fonts = {
  light: 'Quicksand-Light',
  regular: 'Quicksand-Regular',
  medium: 'Quicksand-Medium',
  semibold: 'Quicksand-SemiBold',
  bold: 'Quicksand-Bold',
  cute: 'Quicksand-Bold', 
  sans: 'Quicksand-Regular', 
};

// ─────────────────────────────────────────
// 📱 COMPONENT SIZE
// ─────────────────────────────────────────
const size = {
  button: {
    sm: 36,
    md: 48,
    lg: 56,
  },
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },
  avatar: {
    sm: 32,
    md: 48,
    lg: 80,
    xl: 128,
  },
  input: {
    height: 52,
  },
};

// ─────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────
module.exports = {
  palette,
  semantic,
  spacing,
  fontSize,
  fontWeight,
  borderRadius,
  shadow,
  animation,
  size,
  fonts,
};
