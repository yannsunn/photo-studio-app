/**
 * 服装画像生成APIエンドポイント（簡易版）
 * 実際の画像生成にはStable DiffusionなどのAPIが必要
 */

import { NextRequest, NextResponse } from 'next/server';

// 白背景の服装画像URL（デモ用 - Unsplashから）
const SAMPLE_IMAGES: Record<string, string[]> = {
  tops: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop',
  ],
  bottoms: [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop',
  ],
  accessories: [
    'https://images.unsplash.com/photo-1515248137880-45e105b710e0?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop',
  ],
  shoes: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop',
  ],
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
    const imageUrl = images[Math.floor(Math.random() * images.length)];

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