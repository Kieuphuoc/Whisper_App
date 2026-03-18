/**
 * Design Token System — Single Source of Truth
 * 
 * Feeds into:
 *   - tailwind.config.js  → NativeWind className
 *   - constants/Colors.ts → JS/StyleSheet values
 */

const { palette, semantic, spacing, fontSize, fontWeight, borderRadius, shadow, animation, size } = require('./constants/tokens');

module.exports = {
    darkMode: "class",
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            // 🎨 Colors
            colors: {
                primary: palette.purple,
                secondary: palette.pink,
                success: {
                    500: palette.green[500],
                    600: palette.green[600],
                },
                error: {
                    500: palette.red[500],
                    600: palette.red[600],
                },
                warning: {
                    500: palette.yellow[500],
                    600: palette.yellow[600],
                },
                gray: palette.gray,
            },

            // 📏 Spacing (extends Tailwind defaults)
            spacing: {
                '0.5': 2,
                '4.5': 18,
                '13': 52,
                '18': 72,
            },

            // 🔤 Font Size
            fontSize: {
                'xs': [fontSize.xs, { lineHeight: '16px' }],
                'sm': [fontSize.sm, { lineHeight: '20px' }],
                'md': [fontSize.md, { lineHeight: '24px' }],
                'lg': [fontSize.lg, { lineHeight: '28px' }],
                'xl': [fontSize.xl, { lineHeight: '28px' }],
                '2xl': [fontSize['2xl'], { lineHeight: '32px' }],
                '3xl': [fontSize['3xl'], { lineHeight: '36px' }],
                '4xl': [fontSize['4xl'], { lineHeight: '40px' }],
            },

            // 🔤 Font Family
            fontFamily: {
                quicksand: ["Quicksand_400Regular"],
            },

            // 🔲 Border Radius
            borderRadius: {
                'none': borderRadius.none,
                'sm': borderRadius.sm,
                'DEFAULT': borderRadius.md,
                'md': borderRadius.md,
                'lg': borderRadius.lg,
                'xl': borderRadius.xl,
                'full': borderRadius.full,
                // Semantic
                'card': borderRadius.card,
                'btn': borderRadius.btn,
                'input': borderRadius.input,
                'avatar': borderRadius.avatar,
            },

            // 🎞 Animation Duration
            transitionDuration: {
                'fast': animation.fast,
                'normal': animation.normal,
                'slow': animation.slow,
            },


        },
    },
    plugins: [],
};
