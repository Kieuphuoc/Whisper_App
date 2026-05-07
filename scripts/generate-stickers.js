const fs = require('fs');
const path = require('path');

const stickerDir = path.join(__dirname, '../assets/stickers');
const outputFile = path.join(__dirname, '../constants/stickers.ts');

try {
    if (!fs.existsSync(stickerDir)) {
        console.error('❌ Thư mục assets/stickers không tồn tại!');
        process.exit(1);
    }

    const files = fs.readdirSync(stickerDir).filter(f => 
        f.endsWith('.webp') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')
    );

    const imports = files.map(f => {
        const name = path.parse(f).name;
        return `    '${name}': require('../assets/stickers/${f}'),`;
    }).join('\n');

    const content = `export const STICKERS: Record<string, any> = {
${imports}
};

export type StickerId = keyof typeof STICKERS;

export const getStickerSource = (id: string) => {
    return STICKERS[id] || null;
};
`;

    fs.writeFileSync(outputFile, content);
    console.log(`✅ Thành công! Đã cập nhật ${files.length} sticker vào file constants/stickers.ts`);
} catch (error) {
    console.error('❌ Lỗi khi quét sticker:', error);
}
