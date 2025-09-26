/**
 * 画像エンハンスメントAPIエンドポイント
 * アップスケール、画質向上、背景除去などの処理
 */

import { NextRequest, NextResponse } from 'next/server';

interface EnhanceRequest {
  imageUrl: string;
  enhancements: {
    upscale?: boolean;
    upscaleFactor?: 2 | 4;  // 2x or 4x upscaling
    removeBackground?: boolean;
    enhanceQuality?: boolean;
    sharpen?: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: EnhanceRequest = await request.json();
    const { imageUrl, enhancements } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: '画像URLが必要です' },
        { status: 400 }
      );
    }

    const apiKey = process.env.FAL_KEY;
    if (!apiKey) {
      // デモモード: 元の画像をそのまま返す
      return NextResponse.json({
        success: true,
        enhancedUrl: imageUrl,
        enhancements: enhancements,
        demo: true
      });
    }

    let resultUrl = imageUrl;

    // アップスケール処理
    if (enhancements.upscale) {
      try {
        const upscaleResponse = await fetch('https://fal.run/fal-ai/real-esrgan', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: resultUrl,
            scale: enhancements.upscaleFactor || 2,
            face_enhance: true,
          }),
        });

        if (upscaleResponse.ok) {
          const upscaleData = await upscaleResponse.json();
          resultUrl = upscaleData.image?.url || resultUrl;
        }
      } catch (error) {
        console.error('Upscale error:', error);
      }
    }

    // 背景除去処理
    if (enhancements.removeBackground) {
      try {
        const removeBackgroundResponse = await fetch('https://fal.run/fal-ai/imageutils/rembg', {
          method: 'POST',
          headers: {
            'Authorization': `Key ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: resultUrl,
          }),
        });

        if (removeBackgroundResponse.ok) {
          const removeBackgroundData = await removeBackgroundResponse.json();
          resultUrl = removeBackgroundData.image?.url || resultUrl;
        }
      } catch (error) {
        console.error('Background removal error:', error);
      }
    }

    return NextResponse.json({
      success: true,
      enhancedUrl: resultUrl,
      enhancements: enhancements,
      demo: false
    });

  } catch (error) {
    console.error('Enhancement error:', error);
    return NextResponse.json(
      { error: '画像の処理に失敗しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}