/**
 * 画像合成APIエンドポイント
 * セキュアな処理とレート制限を実装
 */

import { NextRequest, NextResponse } from 'next/server';
import { NanoBananaClient } from '@/lib/nano-banana-client';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
};

/**
 * Rate limiting check
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (clientData.count >= RATE_LIMIT.maxRequests) {
    return false;
  }

  clientData.count++;
  return true;
}

/**
 * POST /api/synthesize
 * 服装合成を実行
 */
export async function POST(request: NextRequest) {
  let body: { personImageUrl?: string; garmentImageUrl?: string; prompt?: string; apiType?: string; garmentCategory?: string } = {};
  let apiType = 'nanoBanana';

  try {
    // Parse request body
    body = await request.json();
    apiType = body.apiType || 'nanoBanana';
    const { personImageUrl, garmentImageUrl, prompt } = body;
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'レート制限を超えました。後でもう一度お試しください。' },
        { status: 429 }
      );
    }

    // Validation
    if (!personImageUrl || !garmentImageUrl) {
      return NextResponse.json(
        { error: '人物と服の両方の画像URLが必要です' },
        { status: 400 }
      );
    }

    // Validate URLs
    if (!NanoBananaClient.validateImageUrl(personImageUrl) ||
        !NanoBananaClient.validateImageUrl(garmentImageUrl)) {
      return NextResponse.json(
        { error: '無効な画像URLが提供されました' },
        { status: 400 }
      );
    }

    // Sanitize prompt if provided
    const sanitizedPrompt = prompt ?
      NanoBananaClient.sanitizePrompt(prompt) :
      undefined;

    let result;
    let responseData;

    // 両方のAPIタイプで同じVirtual Try-On APIを使用（SeeDreamは現在利用不可）
    if (false && apiType === 'seeDream') {
      // SeeDream APIは現在利用できないため、同じVirtual Try-On APIを使用
      // 将来的に別のAPIが利用可能になったら、ここに実装を追加
    } else {
      // Nano Banana APIを使用（デフォルト）
      const apiKey = process.env.FAL_KEY || process.env.NANO_BANANA_KEY;

      // APIキーがない場合はデモモードで動作
      // デモモード: fal.aiの残高問題が解決するまで一時的にダミー画像を返す
      if (!apiKey || process.env.DEMO_MODE === 'true') { // APIキーがない場合もデモモード
        // デモ用の合成画像（実際のサンプル画像URL）
        result = {
          images: [
            {
              url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=512&h=768&fit=crop', // デモ用のサンプル画像
              content_type: 'image/jpeg',
              file_name: 'demo-synthesis.jpg',
              file_size: 100000,
              width: 512,
              height: 768,
            }
          ],
          timings: {
            inference: 1.5
          },
          demo: true // デモモードのフラグ
        };

        // 2秒待機して処理をシミュレート
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        const client = new NanoBananaClient(apiKey);
        result = await client.synthesizeOutfit(
          personImageUrl!,  // Type assertion since we validated it exists
          garmentImageUrl!,  // Type assertion since we validated it exists
          {
            prompt: sanitizedPrompt,
            numImages: 1,
            outputFormat: 'png',
          }
        );
      }

      responseData = {
        success: true,
        images: result.images,
        timings: result.timings,
        apiUsed: 'nanoBanana',
        demo: result.demo || false,
      };
    }

    // Return success response
    return NextResponse.json(responseData);

  } catch (error: unknown) {
    // 詳細なエラーロギング
    const errorDetails = {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error,
      apiType,
      personImageUrl: body?.personImageUrl?.substring(0, 50),
      garmentImageUrl: body?.garmentImageUrl?.substring(0, 50),
      envKeys: {
        FAL_KEY: !!process.env.FAL_KEY,
        FAL_KEY_LENGTH: process.env.FAL_KEY?.length || 0,
        NANO_BANANA_KEY: !!process.env.NANO_BANANA_KEY
      },
      timestamp: new Date().toISOString(),
      requestHeaders: {
        'user-agent': request.headers.get('user-agent'),
        'content-type': request.headers.get('content-type')
      },
      nodeEnv: process.env.NODE_ENV
    };

    console.error('API error:', error);
    console.error('Error details:', JSON.stringify(errorDetails, null, 2));

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error types
    if (errorMessage.includes('FAL_KEY') || errorMessage.includes('API configuration')) {
      return NextResponse.json(
        {
          error: 'API設定エラー: 環境変数を確認してください',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        },
        { status: 500 }
      );
    }

    if (errorMessage.includes('Rate limit')) {
      return NextResponse.json(
        { error: '外部APIのレート制限を超えました' },
        { status: 429 }
      );
    }

    // Generic error response - include details only in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'リクエストの処理に失敗しました',
        details: isDevelopment ? errorMessage : undefined,
        apiType
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/synthesize
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