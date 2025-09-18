/**
 * 服装画像生成APIエンドポイント（簡易版）
 * 実際の画像生成にはStable DiffusionなどのAPIが必要
 */

import { NextRequest, NextResponse } from 'next/server';

// 仮の画像URL（実際にはAI生成APIを使用）
const SAMPLE_IMAGES: Record<string, string[]> = {
  tops: [
    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400',
    'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400',
    'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=400',
  ],
  bottoms: [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=400',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
  ],
  accessories: [
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400',
    'https://images.unsplash.com/photo-1571689936114-b16146c9570a?w=400',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
  ],
  shoes: [
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
    'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=400',
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

    // 実際のAPIの場合は以下のようになります:
    // const response = await fetch('https://api.stability.ai/v1/generation', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     prompt: prompt,
    //     samples: 1,
    //     style_preset: 'photographic',
    //   }),
    // });

    // デモ用：ランダムなサンプル画像を返す
    const images = SAMPLE_IMAGES[category] || SAMPLE_IMAGES.tops;
    const randomIndex = Math.floor(Math.random() * images.length);

    // 遅延を追加して生成処理をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      imageUrl: images[randomIndex],
      prompt: prompt,
      category: category,
    });

  } catch (error) {
    console.error('Generate clothing error:', error);
    return NextResponse.json(
      { error: '画像生成に失敗しました' },
      { status: 500 }
    );
  }
}