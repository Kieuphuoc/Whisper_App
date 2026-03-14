
export type EmotionType = 'Vui vẻ' | 'U sầu' | 'Bình yên' | 'Hoài niệm' | 'Lãng mạn' | 'Bí ẩn' | 'Năng động' | 'Truyền cảm hứng' | 'Cô đơn' | 'Giận dữ';

export interface EmotionConfig {
    label: string;
    color: string;
    description: string;
}

export const EMOTIONS: Record<EmotionType, EmotionConfig> = {
    'Vui vẻ': {
        label: 'Vui vẻ',
        color: '#FFD700',
        description: 'Năng lượng tích cực và niềm vui'
    },
    'U sầu': {
        label: 'U sầu',
        color: '#4682B4',
        description: 'Những khoảnh khắc suy tư, buồn bã'
    },
    'Bình yên': {
        label: 'Bình yên',
        color: '#48D1CC',
        description: 'Sự bình yên, nhẹ nhàng và thư thái'
    },
    'Hoài niệm': {
        label: 'Hoài niệm',
        color: '#DDA0DD',
        description: 'Kỷ niệm, nỗi nhớ và những điều xưa cũ'
    },
    'Lãng mạn': {
        label: 'Lãng mạn',
        color: '#FF69B4',
        description: 'Tình yêu, sự ngọt ngào và lãng mạn'
    },
    'Bí ẩn': {
        label: 'Bí ẩn',
        color: '#6A5ACD',
        description: 'Những điều bí ẩn, sâu sắc và chưa kể'
    },
    'Năng động': {
        label: 'Năng động',
        color: '#FF4500',
        description: 'Sôi nổi, đầy nhiệt huyết và năng lượng'
    },
    'Truyền cảm hứng': {
        label: 'Truyền cảm hứng',
        color: '#ADFF2F',
        description: 'Sáng tạo và đầy ý tưởng mới'
    },
    'Cô đơn': {
        label: 'Cô đơn',
        color: '#708090',
        description: 'Cảm giác trống vắng và một mình'
    },
    'Giận dữ': {
        label: 'Giận dữ',
        color: '#FF0000',
        description: 'Sự bực bội và phẫn nộ'
    }
};

export const EMOTION_COLORS: Record<EmotionType, string> = Object.entries(EMOTIONS).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value.color }),
    {} as Record<EmotionType, string>
);

export const EMOTION_LABELS: Record<EmotionType, string> = Object.entries(EMOTIONS).reduce(
    (acc, [key, value]) => ({ ...acc, [key]: value.label }),
    {} as Record<EmotionType, string>
);
