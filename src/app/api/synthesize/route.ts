/**
 * 画像合成APIエンドポイント
 * セキュアな処理とレート制限を実装
 */

import { NextRequest, NextResponse } from 'next/server';
import { NanoBananaClient } from '@/lib/nano-banana-client';
import { SeeDreamClient } from '@/lib/seedream-client';

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
  let body: { personImageUrl?: string; garmentImageUrl?: string; prompt?: string; apiType?: string; garmentCategory?: string; replacementMode?: string } = {};
  let apiType = 'nanoBanana';

  try {
    // Parse request body
    body = await request.json();
    apiType = body.apiType || 'nanoBanana';
    const { personImageUrl, garmentImageUrl, prompt, replacementMode } = body;
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

    // Validate URLs with detailed error messages
    const personUrlValid = NanoBananaClient.validateImageUrl(personImageUrl);
    const garmentUrlValid = NanoBananaClient.validateImageUrl(garmentImageUrl);

    if (!personUrlValid || !garmentUrlValid) {
      console.error('URL validation failed:', {
        personUrl: personImageUrl?.substring(0, 100),
        garmentUrl: garmentImageUrl?.substring(0, 100),
        personUrlValid,
        garmentUrlValid,
      });
      return NextResponse.json(
        { error: '無効な画像URLが提供されました' },
        { status: 400 }
      );
    }

    // Sanitize prompt if provided
    const sanitizedPrompt = prompt ?
      NanoBananaClient.sanitizePrompt(prompt) :
      undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let responseData: any;

    // 常に高品質モードを使用（APIコストは同じため）
    // apiTypeパラメータは後方互換性のために残すが、常に高品質処理を実行
    if (true) { // 常に高品質モード
      // 高品質モード: 同じAPIだが異なるパラメータを使用
      const apiKey = process.env.FAL_KEY || process.env.SEEDREAM_KEY;

      if (!apiKey || process.env.DEMO_MODE === 'true') {
        // デモモード
        result = {
          images: [
            {
              url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=512&h=768&fit=crop',
              content_type: 'image/jpeg',
              file_name: 'demo-synthesis-hq.jpg',
              file_size: 100000,
              width: 512,
              height: 768,
            }
          ],
          timings: { inference: 2.5 },
          demo: true
        };
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        // 高品質モード: より詳細なパラメータでNano Bananaを使用
        const client = new NanoBananaClient(apiKey);
        const highQualityPrompt = replacementMode === 'overlay'
          ? `Add the garment as a layer with ultra-realistic lighting, shadows, and fabric physics. Preserve every detail and texture.`
          : `Replace clothing with photorealistic quality. Perfect fabric draping, accurate shadows, preserve all details of the garment.`;

        result = await client.synthesizeOutfit(
          personImageUrl!,
          garmentImageUrl!,
          {
            prompt: sanitizedPrompt || highQualityPrompt,
            numImages: 1,
            outputFormat: 'png',
            replacementMode: replacementMode as 'replace' | 'overlay' || 'replace',
          }
        );
      }

      responseData = {
        success: true,
        images: result.images,
        timings: result.timings,
        apiUsed: 'highQuality',
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