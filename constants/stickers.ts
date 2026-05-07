export const STICKERS: Record<string, any> = {
    'aa': require('../assets/stickers/aa.webp'),
    'angry': require('../assets/stickers/angry.webp'),
    'cry_loud': require('../assets/stickers/cry_loud.webp'),
    'eating': require('../assets/stickers/eating.webp'),
    'exhausted': require('../assets/stickers/exhausted.webp'),
    'happy': require('../assets/stickers/happy.webp'),
    'moa': require('../assets/stickers/moa.webp'),
    'nothing': require('../assets/stickers/nothing.webp'),
    'shy': require('../assets/stickers/shy.webp'),
    'sleep': require('../assets/stickers/sleep.webp'),
    'uh': require('../assets/stickers/uh.webp'),
};

export type StickerId = keyof typeof STICKERS;

export const getStickerSource = (id: string) => {
    return STICKERS[id] || null;
};
