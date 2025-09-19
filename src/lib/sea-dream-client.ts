/**
 * SEA DREAM (fal.ai) クライアント
 * 高品質な服装合成API実装
 */

import axios from 'axios';

interface SeaDreamRequest {
  model_image: string;  // 人物画像
  garment_image: string; // 服の画像
  category?: 'tops' | 'bottoms' | 'dress';
}

interface SeaDreamResponse {
  image: string;
  seed: number;
  timings?: {
    inference: number;
  };
}

export class SeaDreamClient {
  private apiKey: string;
  private baseUrl = 'https://fal.run/fal-ai/cat-vton';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.FAL_KEY;
    if (!key) {
      throw new Error('FAL_KEYが設定されていません');
    }
    this.apiKey = key;
  }

  /**
   * SEA DREAMで服装合成を実行
   */
  async synthesizeOutfit(
    personImageUrl: string,
    garmentImageUrl: string,
    options: {
      category?: 'tops' | 'bottoms' | 'dress';
    } = {}
  ): Promise<SeaDreamResponse> {
    const requestBody: SeaDreamRequest = {
      model_image: personImageUrl,
      garment_image: garmentImageUrl,
      category: options.category || 'tops',
    };

    try {
      const response = await axios.post(
        this.baseUrl,
        requestBody,
        {
          headers: {
            'Authorization': `Key ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data as SeaDreamResponse;
    } catch (error) {
      console.error('SEA DREAM API error:', error);
      throw new Error('SEA DREAM: 服装合成に失敗しました');
    }
  }

  /**
   * URLの検証
   */
  static validateImageUrl(url: string): boolean {
    // Data URLを許可
    if (url.startsWith('data:image/')) {
      return true;
    }

    // HTTP/HTTPS URLをチェック
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }
}