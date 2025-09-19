/**
 * 服装画像生成APIエンドポイント（簡易版）
 * 実際の画像生成にはStable DiffusionなどのAPIが必要
 */

import { NextRequest, NextResponse } from 'next/server';

// 白背景の服装画像URL（デモ用）
const SAMPLE_IMAGES: Record<string, string[]> = {
  tops: [
    'https://m.media-amazon.com/images/I/41TfJBsDD5L._AC_.jpg',
    'https://m.media-amazon.com/images/I/51ZQFZwEpuL._AC_.jpg',
    'https://m.media-amazon.com/images/I/41LxySi0YfL._AC_.jpg',
  ],
  bottoms: [
    'https://m.media-amazon.com/images/I/31fDhykXu5L._AC_.jpg',
    'https://m.media-amazon.com/images/I/31SKpuJHsXL._AC_.jpg',
    'https://m.media-amazon.com/images/I/41gPKRmXsGL._AC_.jpg',
  ],
  accessories: [
    'https://m.media-amazon.com/images/I/41AcFt6UUSL._AC_.jpg',
    'https://m.media-amazon.com/images/I/51ESppCQU4L._AC_.jpg',
    'https://m.media-amazon.com/images/I/41vIhU3UbWL._AC_.jpg',
  ],
  shoes: [
    'https://m.media-amazon.com/images/I/31HGCzHCQdL._AC_.jpg',
    'https://m.media-amazon.com/images/I/41AeYjcCBaL._AC_.jpg',
    'https://m.media-amazon.com/images/I/41dqJJHHp9L._AC_.jpg',
  ],
};

// プレースホルダー画像（白背景）を使用
const PLACEHOLDER_IMAGES = {
  tops: 'https://via.placeholder.com/400x400/FFFFFF/333333?text=トップス',
  bottoms: 'https://via.placeholder.com/400x400/FFFFFF/333333?text=ボトムス',
  accessories: 'https://via.placeholder.com/400x400/FFFFFF/333333?text=アクセサリー',
  shoes: 'https://via.placeholder.com/400x400/FFFFFF/333333?text=靴',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, category } = body;

    // バリデーション
    if (!prompt || !category) {
      return NextResponse.json(
        { error: 'プロンプトとカテゴリが必要です' },
        { status: 400 }
      );
    }

    // カテゴリを確実に正しく処理
    let adjustedCategory = category;

    // プロンプトからカテゴリを推測
    if (prompt.includes('ネックレス') || prompt.includes('ブレスレット') || prompt.includes('イヤリング') || prompt.includes('指輪')) {
      adjustedCategory = 'accessories';
    } else if (prompt.includes('バッグ') || prompt.includes('リュック') || prompt.includes('鞄')) {
      adjustedCategory = 'accessories'; // バッグもアクセサリーとして扱う
    }

    // デモ用：カテゴリに応じた画像を返す
    // 実際のプロダクションではAI生成APIを使用
    const images = SAMPLE_IMAGES[adjustedCategory] || SAMPLE_IMAGES.tops;

    // ランダムに選択するか、プレースホルダーを使用
    const usePlayceholder = Math.random() < 0.3; // 30%の確率でプレースホルダー
    const imageUrl = usePlayceholder
      ? PLACEHOLDER_IMAGES[adjustedCategory as keyof typeof PLACEHOLDER_IMAGES] || PLACEHOLDER_IMAGES.tops
      : images[Math.floor(Math.random() * images.length)];

    // 遅延を追加して生成処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      category: adjustedCategory,
    });

  } catch (error) {
    console.error('Generate clothing error:', error);
    return NextResponse.json(
      { error: '画像生成に失敗しました' },
      { status: 500 }
    );
  }
}