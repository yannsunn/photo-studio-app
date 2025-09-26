/**
 * 複数箇所同時着替えAPIエンドポイント
 */

import { NextRequest, NextResponse } from 'next/server';
import { NanoBananaClient } from '@/lib/nano-banana-client';
import { AdvancedVirtualTryOn } from '@/lib/advanced-virtual-tryon';

interface MultiGarmentRequest {
  personImageUrl: string;
  garments: Array<{
    type: 'upper' | 'lower' | 'outer';
    imageUrl: string;
  }>;
  preservePose?: boolean;
  preserveBackground?: boolean;
}

/**
 * POST /api/multi-synthesize
 * 複数箇所の服装を同時に変更
 */
export async function POST(request: NextRequest) {
  try {
    const body: MultiGarmentRequest = await request.json();
    const { personImageUrl, garments, preservePose = true, preserveBackground = true } = body;

    // Validation
    if (!personImageUrl) {
      return NextResponse.json(
        { error: '人物画像が必要です' },
        { status: 400 }
      );
    }

    if (!garments || garments.length === 0) {
      return NextResponse.json(
        { error: '少なくとも1つの服画像が必要です' },
        { status: 400 }
      );
    }

    if (garments.length > 3) {
      return NextResponse.json(
        { error: '同時に変更できるのは最大3箇所までです' },
        { status: 400 }
      );
    }

    // APIキーの確認
    const apiKey = process.env.FAL_KEY || process.env.NANO_BANANA_KEY;

    if (!apiKey || process.env.DEMO_MODE === 'true') {
      // デモモード
      await new Promise(resolve => setTimeout(resolve, 3000));
      return NextResponse.json({
        success: true,
        images: [{
          url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=512&h=768&fit=crop',
          content_type: 'image/jpeg',
          file_name: 'multi-synthesis-demo.jpg',
        }],
        processedGarments: garments.map(g => g.type),
        demo: true,
      });
    }

    // 複数の服を組み合わせたプロンプトを生成
    let combinedPrompt = generateMultiGarmentPrompt(garments, preservePose, preserveBackground);

    // 画像の結合処理（実際の実装では複数画像を処理）
    const client = new NanoBananaClient(apiKey);

    // 段階的な処理アプローチ
    let currentImage = personImageUrl;
    let processedTypes: string[] = [];

    // 各服を順番に適用（理想的には並列処理）
    for (const garment of garments) {
      const tryOnOptions = {
        personImageUrl: currentImage,
        garmentImageUrl: garment.imageUrl,
        garmentType: garment.type,
        preservePose,
        preserveBackground,
      };

      const prompt = AdvancedVirtualTryOn.generatePrompt(tryOnOptions);

      const result = await client.synthesizeOutfit(
        currentImage,
        garment.imageUrl,
        {
          prompt,
          numImages: 1,
          outputFormat: 'png',
        }
      );

      if (result.images && result.images.length > 0) {
        currentImage = result.images[0].url;
        processedTypes.push(garment.type);
      }
    }

    return NextResponse.json({
      success: true,
      images: [{
        url: currentImage,
        content_type: 'image/png',
        file_name: 'multi-synthesis.png',
      }],
      processedGarments: processedTypes,
      demo: false,
    });

  } catch (error) {
    console.error('Multi-synthesis error:', error);

    return NextResponse.json(
      {
        error: '複数箇所の着替え処理に失敗しました',
        details: process.env.NODE_ENV === 'development' ?
          (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * 複数服用のプロンプト生成
 */
function generateMultiGarmentPrompt(
  garments: Array<{ type: string; imageUrl: string }>,
  preservePose: boolean,
  preserveBackground: boolean
): string {
  const garmentTypes = garments.map(g => g.type);

  let prompt = 'Replace the following clothing items simultaneously:\n';

  if (garmentTypes.includes('upper')) {
    prompt += '- Upper body clothing (shirt, top) with the provided upper garment\n';
  }
  if (garmentTypes.includes('lower')) {
    prompt += '- Lower body clothing (pants, skirt) with the provided lower garment\n';
  }
  if (garmentTypes.includes('outer')) {
    prompt += '- Add or replace outer layer (jacket, coat) with the provided outer garment\n';
  }

  // 保持する部分の指定
  if (!garmentTypes.includes('upper') && garmentTypes.length < 3) {
    prompt += 'KEEP the original upper body clothing unchanged.\n';
  }
  if (!garmentTypes.includes('lower') && garmentTypes.length < 3) {
    prompt += 'KEEP the original lower body clothing unchanged.\n';
  }

  if (preservePose) {
    prompt += 'IMPORTANT: Maintain the exact same pose, body position, and posture.\n';
  }

  if (preserveBackground) {
    prompt += 'Keep the background exactly as it is.\n';
  }

  prompt += 'Ensure natural fit, realistic shadows, and proper fabric draping for all garments.';

  return prompt;
}

/**
 * OPTIONS /api/multi-synthesize
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}