/**
 * Seedream API クライアント
 * 高速画像処理とバッチ処理に最適化
 */

import axios from 'axios';

interface SeedreamRequest {
  imageUrl: string;
  mode?: 'standard' | 'premium';
  enhancements?: Array<'colorCorrection' | 'edgeOptimization'>;
  priority?: 'normal' | 'low';
  batchId?: string;
}

interface SeedreamResponse {
  success: boolean;
  imageUrl: string;
  processTime: number;
  cost: number;
  taskId: string;
}

interface BatchRequest {
  images: Array<{
    imageUrl: string;
    mode?: 'standard' | 'premium';
    enhancements?: Array<'colorCorrection' | 'edgeOptimization'>;
  }>;
  priority?: 'normal' | 'low';
}

interface BatchResponse {
  success: boolean;
  batchId: string;
  totalImages: number;
  estimatedCost: number;
  estimatedTime: number;
  tasks: Array<{
    taskId: string;
    imageUrl: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  }>;
}

export class SeedreamApiClient {
  private apiKey: string;
  private baseUrl = 'https://api.seedream.io/v1';

  // 料金設定
  private pricing = {
    standard: 0.036,
    colorCorrection: 0.003,
    edgeOptimization: 0.004,
    batchDiscount: 0.20,
    lowPriorityDiscount: 0.30,
  };

  constructor(apiKey?: string) {
    const key = apiKey || process.env.SEEDREAM_API_KEY;
    if (!key) {
      throw new Error('SEEDREAM_API_KEYが設定されていません');
    }
    this.apiKey = key.trim().replace(/[\r\n\t]/g, '');
  }

  /**
   * 単一画像の処理
   */
  async processImage(request: SeedreamRequest): Promise<SeedreamResponse> {
    const { imageUrl, mode = 'standard', enhancements = [], priority = 'normal', batchId } = request;

    // コスト計算
    const cost = this.calculateCost(mode, enhancements, priority, !!batchId);

    // リクエストボディの構築
    const requestBody = {
      image_url: imageUrl,
      processing_mode: mode,
      enhancements: enhancements,
      priority: priority,
      batch_id: batchId,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Seedream: Processing image:', imageUrl);
        console.log('Seedream: Estimated cost:', `$${cost.toFixed(3)}`);
      }

      const response = await axios.post(
        `${this.baseUrl}/process`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: priority === 'low' ? 60000 : 30000, // 低優先度は60秒、通常は30秒
        }
      );

      return {
        success: true,
        imageUrl: response.data.output_url,
        processTime: response.data.process_time,
        cost: cost,
        taskId: response.data.task_id,
      };
    } catch (error) {
      console.error('Seedream API error:', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Seedream: APIキーが無効です');
        } else if (error.response?.status === 429) {
          throw new Error('Seedream: レート制限に達しました');
        } else if (error.response?.status === 402) {
          throw new Error('Seedream: クレジットが不足しています');
        }
      }

      throw new Error('Seedream: 画像処理に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * バッチ処理の開始
   */
  async startBatchProcessing(request: BatchRequest): Promise<BatchResponse> {
    const { images, priority = 'normal' } = request;

    // 総コスト計算（バッチ割引適用）
    let totalCost = 0;
    images.forEach(img => {
      const baseCost = this.calculateCost(img.mode || 'standard', img.enhancements || [], priority, true);
      totalCost += baseCost;
    });

    // バッチリクエストボディ
    const requestBody = {
      batch_images: images.map(img => ({
        image_url: img.imageUrl,
        processing_mode: img.mode || 'standard',
        enhancements: img.enhancements || [],
      })),
      priority: priority,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Seedream: Starting batch processing for', images.length, 'images');
        console.log('Seedream: Estimated total cost:', `$${totalCost.toFixed(2)}`);
      }

      const response = await axios.post(
        `${this.baseUrl}/batch/start`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        batchId: response.data.batch_id,
        totalImages: images.length,
        estimatedCost: totalCost,
        estimatedTime: response.data.estimated_time,
        tasks: response.data.tasks,
      };
    } catch (error) {
      console.error('Seedream Batch API error:', error);
      throw new Error('Seedream: バッチ処理の開始に失敗しました');
    }
  }

  /**
   * バッチ処理の状態確認
   */
  async checkBatchStatus(batchId: string): Promise<BatchResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/batch/${batchId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Seedream Batch Status error:', error);
      throw new Error('Seedream: バッチ状態の確認に失敗しました');
    }
  }

  /**
   * コスト計算
   */
  private calculateCost(
    mode: string,
    enhancements: string[],
    priority: string,
    isBatch: boolean
  ): number {
    let cost = this.pricing.standard;

    // エンハンスメント料金
    if (enhancements.includes('colorCorrection')) {
      cost += this.pricing.colorCorrection;
    }
    if (enhancements.includes('edgeOptimization')) {
      cost += this.pricing.edgeOptimization;
    }

    // バッチ割引
    if (isBatch) {
      cost *= (1 - this.pricing.batchDiscount);
    }

    // 低優先度割引
    if (priority === 'low') {
      cost *= (1 - this.pricing.lowPriorityDiscount);
    }

    return cost;
  }

  /**
   * 画像URLの検証
   */
  static validateImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Data URLを許可
    if (url.startsWith('data:image/')) {
      return true;
    }

    // Blob URLを許可
    if (url.startsWith('blob:')) {
      return true;
    }

    // HTTP/HTTPS URLをチェック
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:', 'blob:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
}