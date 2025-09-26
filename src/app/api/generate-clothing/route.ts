/**
 * 服装画像生成APIエンドポイント
 * fal.ai APIを使用して白背景の商品画像を生成
 */

import { NextRequest, NextResponse } from 'next/server';

// カテゴリごとのプロンプトテンプレート
const CATEGORY_PROMPTS: Record<string, string> = {
  tops: 'a clean white shirt, product photo, white background, studio lighting, high quality, professional photography',
  bottoms: 'blue denim jeans, product photo, white background, studio lighting, high quality, professional photography',
  accessories: 'silver necklace jewelry, product photo, white background, studio lighting, high quality, professional photography',
  shoes: 'white sneakers shoes, product photo, white background, studio lighting, high quality, professional photography',
};

// fal.aiエンドポイント
const FAL_API_URL = 'https://fal.run/fal-ai/flux-lora';

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

    // 環境変数からAPIキーを取得（改行や不正な文字を除去）
    const rawKey = process.env.FAL_KEY || process.env.NANO_BANANA_KEY;
    const apiKey = rawKey?.trim().replace(/[\r\n\t]/g, '');
    if (!apiKey) {
      console.error('API key not found in environment variables');
      console.error('Available env keys:', {
        FAL_KEY: !!process.env.FAL_KEY,
        NANO_BANANA_KEY: !!process.env.NANO_BANANA_KEY
      });
      // APIキーが設定されていない場合はダミー画像を返す
      return NextResponse.json({
        success: true,
        imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ3aGl0ZSIvPgo8dGV4dCB4PSIyMDAiIHk9IjIwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjY2NjIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBhbGlnbm1lbnQtYmFzZWxpbmU9Im1pZGRsZSI+CiAgICBbUHJvZHVjdCBJbWFnZV0KPC90ZXh0Pgo8L3N2Zz4=',
        prompt: prompt,
        category: category,
      });
    }

    // カテゴリを確実に正しく処理
    let adjustedCategory = category;

    // プロンプトからカテゴリを推測
    if (prompt.includes('ネックレス') || prompt.includes('ブレスレット') || prompt.includes('イヤリング') || prompt.includes('指輪')) {
      adjustedCategory = 'accessories';
    } else if (prompt.includes('バッグ') || prompt.includes('リュック') || prompt.includes('鞄')) {
      adjustedCategory = 'accessories'; // バッグもアクセサリーとして扱う
    }

    // 日本語プロンプトを英語に変換して追加指示を含める
    // 色の指示を優先的に処理
    let enhancedPrompt = prompt;

    // 日本語の色指示を英語に変換
    const colorMap: {[key: string]: string} = {
      '紺色': 'navy blue',
      '紺': 'navy',
      '青': 'blue',
      '赤': 'red',
      '白': 'white',
      '黒': 'black',
      '緑': 'green',
      '黄色': 'yellow',
      'オレンジ': 'orange',
      'ピンク': 'pink',
      '紫': 'purple',
      '茶色': 'brown',
      'グレー': 'gray',
      '灰色': 'gray',
      '金色': 'gold',
      '銀色': 'silver'
    };

    // 色の指示を置換
    for (const [jp, en] of Object.entries(colorMap)) {
      enhancedPrompt = enhancedPrompt.replace(new RegExp(jp, 'g'), en);
    }

    // 光沢・質感の指示を英語に変換
    enhancedPrompt = enhancedPrompt
      .replace(/光沢のある/g, 'glossy')
      .replace(/オーダーメイド/g, 'custom-made tailored')
      .replace(/ジャケット/g, 'jacket')
      .replace(/フォーマル/g, 'formal');

    // プロンプトを生成（白背景の商品画像用）
    const fullPrompt = `${enhancedPrompt}, ${CATEGORY_PROMPTS[adjustedCategory] || CATEGORY_PROMPTS.tops}`;

    // fal.ai APIを呼び出し
    const response = await fetch(FAL_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: 'square_hd',
        num_images: 1,
        num_inference_steps: 4,
        guidance_scale: 3.5,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      console.error('fal.ai API error:', response.statusText);
      throw new Error('画像生成APIでエラーが発生しました');
    }

    const data = await response.json();

    // 生成された画像のURLを返す
    const imageUrl = data.images?.[0]?.url || data.image;

    if (!imageUrl) {
      throw new Error('画像URLが取得できませんでした');
    }

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl,
      prompt: prompt,
      category: adjustedCategory,
    });

  } catch (error) {
    console.error('Generate clothing error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: '画像生成に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}