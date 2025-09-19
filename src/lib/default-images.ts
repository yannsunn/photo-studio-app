/**
 * デフォルト参考画像のURL
 * 実際の商品画像を使用
 */

export const DEFAULT_REFERENCE_IMAGES = [
  {
    id: 'ref-1',
    url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=400&fit=crop&bg=white',
    category: 'tops' as const,
    description: 'クラシックな白シャツ',
  },
  {
    id: 'ref-2',
    url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&bg=white',
    category: 'bottoms' as const,
    description: 'デニムジーンズ',
  },
  {
    id: 'ref-3',
    url: 'https://images.unsplash.com/photo-1515248137880-45e105b710e0?w=400&h=400&fit=crop&bg=white',
    category: 'accessories' as const,
    description: 'ネックレス',
  },
];

// 白背景のサンプル画像（生成用）
export const SAMPLE_CLOTHING_IMAGES = {
  tops: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&bg=white',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop&bg=white',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop&bg=white',
  ],
  bottoms: [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&bg=white',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop&bg=white',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop&bg=white',
  ],
  accessories: [
    'https://images.unsplash.com/photo-1515248137880-45e105b710e0?w=400&h=400&fit=crop&bg=white',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop&bg=white',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop&bg=white',
  ],
  shoes: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&bg=white',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&bg=white',
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop&bg=white',
  ],
};