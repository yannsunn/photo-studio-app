/**
 * 画像合成APIエンドポイント
 * セキュアな処理とレート制限を実装
 */

import { NextRequest, NextResponse } from 'next/server';
import { NanoBananaClient } from '@/lib/nano-banana-client';
// import { SeeDreamClient } from '@/lib/seedream-client';
import { SeedreamApiClient } from '@/lib/seedream-api-client';
import { AdvancedVirtualTryOn } from '@/lib/advanced-virtual-tryon';

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
  let body: { personImageUrl?: string; garmentImageUrl?: string; prompt?: string; apiType?: string; garmentCategory?: string; garmentType?: string; replacementMode?: string; enhancements?: string[]; priority?: string; preservePose?: boolean; poseData?: string; useNaturalLanguageMode?: boolean } = {};
  let apiType = 'nanoBanana';

  try {
    // Parse request body
    body = await request.json();
    apiType = body.apiType || 'nanoBanana';
    const { personImageUrl, garmentImageUrl, prompt, garmentType, replacementMode, enhancements, priority, preservePose, useNaturalLanguageMode } = body;
    // poseData is reserved for future use
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
    if (!personImageUrl) {
      return NextResponse.json(
        { error: '人物の画像URLが必要です' },
        { status: 400 }
      );
    }

    // 自然言語モードの場合、服の画像は不要、プロンプトが必要
    if (useNaturalLanguageMode && !prompt) {
      return NextResponse.json(
        { error: '自然言語の指示が必要です' },
        { status: 400 }
      );
    }

    // 通常モードの場合、服の画像が必要
    if (!useNaturalLanguageMode && !garmentImageUrl) {
      return NextResponse.json(
        { error: '服の画像URLが必要です' },
        { status: 400 }
      );
    }

    // Validate URLs with detailed error messages
    const personUrlValid = NanoBananaClient.validateImageUrl(personImageUrl);
    const garmentUrlValid = !useNaturalLanguageMode ? NanoBananaClient.validateImageUrl(garmentImageUrl!) : true;

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

    // APIタイプに応じて処理を分岐
    if (apiType === 'seedream') {
      // Seedream APIを使用
      const apiKey = process.env.SEEDREAM_API_KEY;

      if (!apiKey || process.env.DEMO_MODE === 'true') {
        // デモモード
        result = {
          success: true,
          imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=512&h=768&fit=crop',
          processTime: 1.5,
          cost: 0.036,
          taskId: 'demo-task-' + Date.now(),
          demo: true
        };
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        const client = new SeedreamApiClient(apiKey);

        // まず人物画像を処理
        await client.processImage({
          imageUrl: personImageUrl!,
          mode: 'standard',
          enhancements: enhancements as Array<'colorCorrection' | 'edgeOptimization'> || [],
          priority: priority as 'normal' | 'low' || 'normal',
        });

        // 次に服画像を処理して合成
        result = await client.processImage({
          imageUrl: garmentImageUrl!,
          mode: 'standard',
          enhancements: ['edgeOptimization'],
          priority: priority as 'normal' | 'low' || 'normal',
        });

        // Seedream用のレスポンスを構築
        result = {
          images: [
            {
              url: result.imageUrl,
              content_type: 'image/png',
              file_name: 'seedream-synthesis.png',
              file_size: 0,
              width: 1024,
              height: 1024,
            }
          ],
          timings: { inference: result.processTime },
          cost: result.cost,
          taskId: result.taskId,
        };
      }

      responseData = {
        success: true,
        images: result.images,
        timings: result.timings,
        cost: result.cost,
        apiUsed: 'seedream',
        demo: result.demo || false,
      };
    } else { // nanoBanana または高品質モード
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
        const client = new NanoBananaClient(apiKey);

        if (useNaturalLanguageMode) {
          // 自然言語モード: テキストの指示で服装を変更
          result = await client.modifyWithNaturalLanguage(
            personImageUrl!,
            sanitizedPrompt!,
            {
              numImages: 1,
              outputFormat: 'png',
            }
          );
        } else {
          // 通常モード: 高度な仮想試着オプションを構築
          const tryOnOptions = {
            personImageUrl: personImageUrl!,
            garmentImageUrl: garmentImageUrl!,
            garmentType: (garmentType || AdvancedVirtualTryOn.detectGarmentType(prompt)) as 'upper' | 'lower' | 'dress' | 'outer',
            preservePose: preservePose !== false, // デフォルトtrue
            preserveBackground: true,
            maskRegion: garmentType === 'upper' ? 'upper_body' as const :
                        garmentType === 'lower' ? 'lower_body' as const :
                        'full_body' as const
          };

          // 高度なプロンプトを生成
          const advancedPrompt = AdvancedVirtualTryOn.generatePrompt(tryOnOptions);
          const highQualityPrompt = sanitizedPrompt || advancedPrompt;

          result = await client.synthesizeOutfit(
            personImageUrl!,
            garmentImageUrl!,
            {
              prompt: highQualityPrompt,
              numImages: 1,
              outputFormat: 'png',
              replacementMode: replacementMode as 'replace' | 'overlay' || 'replace',
            }
          );
        }
      }

      responseData = {
        success: true,
        images: result.images,
        timings: result.timings,
        apiUsed: apiType === 'seedream' ? 'seedream' : 'highQuality',
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