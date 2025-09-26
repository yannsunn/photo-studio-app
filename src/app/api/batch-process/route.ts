/**
 * バッチ処理APIエンドポイント
 * 複数画像の一括処理に対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { SeedreamApiClient } from '@/lib/seedream-api-client';

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration for batch
const BATCH_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxBatches: 3, // 3 batches per 5 minutes
  maxImagesPerBatch: 50, // Maximum 50 images per batch
};

/**
 * Rate limiting check for batch
 */
function checkBatchRateLimit(clientId: string, imageCount: number): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + BATCH_RATE_LIMIT.windowMs,
    });
    return true;
  }

  if (clientData.count >= BATCH_RATE_LIMIT.maxBatches) {
    return false;
  }

  if (imageCount > BATCH_RATE_LIMIT.maxImagesPerBatch) {
    return false;
  }

  clientData.count++;
  return true;
}

/**
 * POST /api/batch-process
 * バッチ処理を開始
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images, priority = 'normal' } = body;

    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Validation
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: '画像リストが必要です' },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkBatchRateLimit(clientIp, images.length)) {
      return NextResponse.json(
        {
          error: `レート制限を超えました。最大${BATCH_RATE_LIMIT.maxImagesPerBatch}枚まで、5分間に${BATCH_RATE_LIMIT.maxBatches}バッチまでです。`
        },
        { status: 429 }
      );
    }

    const apiKey = process.env.SEEDREAM_API_KEY;

    if (!apiKey || process.env.DEMO_MODE === 'true') {
      // デモモード
      const demoResponse = {
        success: true,
        batchId: 'demo-batch-' + Date.now(),
        totalImages: images.length,
        estimatedCost: images.length * 0.029, // バッチ割引適用後の価格
        estimatedTime: images.length * 2,
        tasks: images.map((img, idx) => ({
          taskId: `demo-task-${idx}`,
          imageUrl: img.imageUrl,
          status: 'pending' as const,
        })),
        demo: true,
      };

      return NextResponse.json(demoResponse);
    }

    const client = new SeedreamApiClient(apiKey);

    // バッチリクエストを構築
    const batchRequest = {
      images: images.map(img => ({
        imageUrl: img.imageUrl,
        mode: img.mode || 'standard',
        enhancements: img.enhancements || [],
      })),
      priority: priority as 'normal' | 'low',
    };

    // バッチ処理を開始
    const result = await client.startBatchProcessing(batchRequest);

    return NextResponse.json({
      success: result.success,
      batchId: result.batchId,
      totalImages: result.totalImages,
      estimatedCost: result.estimatedCost,
      estimatedTime: result.estimatedTime,
      tasks: result.tasks,
    });

  } catch (error: unknown) {
    console.error('Batch processing error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage.includes('APIキー')) {
      return NextResponse.json(
        { error: 'API設定エラー: 環境変数を確認してください' },
        { status: 500 }
      );
    }

    if (errorMessage.includes('クレジット')) {
      return NextResponse.json(
        { error: 'クレジットが不足しています' },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: 'バッチ処理の開始に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/batch-process
 * バッチ処理の状態を確認
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { error: 'batchIdが必要です' },
        { status: 400 }
      );
    }

    // デモモードの場合
    if (batchId.startsWith('demo-batch-')) {
      const demoResponse = {
        success: true,
        batchId: batchId,
        totalImages: 5,
        estimatedCost: 0.145,
        estimatedTime: 10,
        tasks: Array.from({ length: 5 }, (_, idx) => ({
          taskId: `demo-task-${idx}`,
          imageUrl: `https://images.unsplash.com/photo-${1595950653106 + idx}-6c9ebd614d3a?w=512&h=768&fit=crop`,
          status: idx < 3 ? 'completed' : idx === 3 ? 'processing' : 'pending',
        })),
        demo: true,
      };

      return NextResponse.json(demoResponse);
    }

    const apiKey = process.env.SEEDREAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API設定エラー' },
        { status: 500 }
      );
    }

    const client = new SeedreamApiClient(apiKey);
    const result = await client.checkBatchStatus(batchId);

    return NextResponse.json(result);

  } catch (error: unknown) {
    console.error('Batch status check error:', error);

    return NextResponse.json(
      { error: 'バッチ状態の確認に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/batch-process
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}