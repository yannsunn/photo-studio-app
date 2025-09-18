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
  try {
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

    // Parse request body
    const body = await request.json();
    const { personImageUrl, garmentImageUrl, prompt } = body;

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

    // Initialize client
    const client = new NanoBananaClient();

    // Execute synthesis
    const result = await client.synthesizeOutfit(
      personImageUrl,
      garmentImageUrl,
      {
        prompt: sanitizedPrompt,
        numImages: 1,
        outputFormat: 'png',
      }
    );

    // Return success response
    return NextResponse.json({
      success: true,
      images: result.images,
      timings: result.timings,
    });

  } catch (error: unknown) {
    console.error('API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle specific error types
    if (errorMessage.includes('FAL_KEY')) {
      return NextResponse.json(
        { error: 'API設定エラー' },
        { status: 500 }
      );
    }

    if (errorMessage.includes('Rate limit')) {
      return NextResponse.json(
        { error: '外部APIのレート制限を超えました' },
        { status: 429 }
      );
    }

    // Generic error response
    return NextResponse.json(
      { error: 'リクエストの処理に失敗しました' },
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