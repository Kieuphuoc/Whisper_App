module.exports = {
    darkMode: "class",
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: {
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
                secondary: {
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
            }
        },
    },
    plugins: [],
}
