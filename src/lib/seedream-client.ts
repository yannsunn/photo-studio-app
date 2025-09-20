/**
 * SeeDream (ByteDance/fal.ai) クライアント
 * ByteDanceの高品質Virtual Try-On API
 */

import axios from 'axios';

interface SeeDreamRequest {
  model_image: string;      // 人物画像URL
  cloth_image: string;      // 服の画像URL
  cloth_type?: 'upper' | 'lower' | 'overall';  // 服のタイプ
  num_inference_steps?: number;  // 推論ステップ数（品質）
  guidance_scale?: number;   // ガイダンススケール
  seed?: number;            // シード値
}

interface SeeDreamResponse {
  images: Array<{
    url: string;
    content_type: string;
    file_name: string;
    file_size: number;
    width: number;
    height: number;
  }>;
  timings?: {
    inference: number;
  };
  seed: number;
  has_nsfw_concepts?: boolean[];
}

export class SeeDreamClient {
  private apiKey: string;
  private baseUrl = 'https://fal.run/fal-ai/seedream';  // ByteDance SeeDream on fal.ai

  constructor(apiKey?: string) {
    const key = apiKey || process.env.FAL_KEY;
    if (!key) {
      throw new Error('FAL_KEYが設定されていません');
    }
    this.apiKey = key;
  }

  /**
   * SeeDreamで服装合成を実行
   */
  async synthesizeOutfit(
    personImageUrl: string,
    garmentImageUrl: string,
    options: {
      clothType?: 'upper' | 'lower' | 'overall';
      numInferenceSteps?: number;
      guidanceScale?: number;
      seed?: number;
    } = {}
  ): Promise<SeeDreamResponse> {
    const requestBody: SeeDreamRequest = {
      model_image: personImageUrl,
      cloth_image: garmentImageUrl,
      cloth_type: options.clothType || 'upper',
      num_inference_steps: options.numInferenceSteps || 30,
      guidance_scale: options.guidanceScale || 2.0,
      seed: options.seed,
    };

    try {
      // SeeDream APIを呼び出し
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

      // レスポンスを返す
      return response.data as SeeDreamResponse;
    } catch (error) {
      console.error('SeeDream API error:', error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('SeeDream: APIキーが無効です');
        } else if (error.response?.status === 429) {
          throw new Error('SeeDream: レート制限に達しました');
        } else if (error.response?.data?.detail) {
          throw new Error(`SeeDream: ${error.response.data.detail}`);
        }
      }

      throw new Error('SeeDream: 服装合成に失敗しました');
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

  /**
   * 服のタイプを自動判定
   */
  static detectClothType(description?: string): 'upper' | 'lower' | 'overall' {
    if (!description) return 'upper';

    const lowerKeywords = ['パンツ', 'ズボン', 'スカート', 'ジーンズ', 'ショーツ', 'bottoms', 'pants', 'skirt'];
    const overallKeywords = ['ワンピース', 'ドレス', 'オーバーオール', 'dress', 'overall'];

    const desc = description.toLowerCase();

    if (overallKeywords.some(keyword => desc.includes(keyword.toLowerCase()))) {
      return 'overall';
    }

    if (lowerKeywords.some(keyword => desc.includes(keyword.toLowerCase()))) {
      return 'lower';
    }

    return 'upper';
  }
}