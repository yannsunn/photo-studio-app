/**
 * SeeDream (ByteDance/fal.ai) クライアント
 * ByteDanceの高品質Virtual Try-On API
 */

import axios from 'axios';

interface SeeDreamRequest {
  prompt: string;           // 編集プロンプト
  image_urls: string[];     // 画像URL配列 [人物, 服]
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
  private baseUrl = 'https://fal.run/fal-ai/bytedance/seedream/v4/edit';  // ByteDance SeeDream v4 on fal.ai

  constructor(apiKey?: string) {
    const key = apiKey || process.env.FAL_KEY;
    if (!key) {
      throw new Error('FAL_KEYが設定されていません');
    }
    // APIキーから改行や不正な文字を除去
    this.apiKey = key.trim().replace(/[\r\n\t]/g, '');
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
    // Create prompt based on cloth type
    const clothTypeText = options.clothType === 'overall' ? 'dress' :
                         options.clothType === 'lower' ? 'pants/skirt' : 'top/shirt';
    const prompt = `Dress the person in the first image with the ${clothTypeText} from the second image. Maintain natural fit and lighting.`;

    const requestBody: SeeDreamRequest = {
      prompt,
      image_urls: [personImageUrl, garmentImageUrl],
      num_inference_steps: options.numInferenceSteps || 30,
      guidance_scale: options.guidanceScale || 2.0,
      seed: options.seed,
    };

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('SeeDream: Submitting request to:', this.baseUrl);
        console.log('SeeDream: Request body:', JSON.stringify(requestBody, null, 2));
      }

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

      if (process.env.NODE_ENV === 'development') {
        console.log('SeeDream: Response status:', response.status);
        console.log('SeeDream: Response data:', JSON.stringify(response.data, null, 2));
      }

      // レスポンスを返す
      return response.data as SeeDreamResponse;
    } catch (error) {
      console.error('SeeDream API error:', error);

      if (axios.isAxiosError(error)) {
        console.error('SeeDream: Response status:', error.response?.status);
        console.error('SeeDream: Response data:', error.response?.data);
        console.error('SeeDream: Request config:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        });

        if (error.response?.status === 401) {
          throw new Error('SeeDream: APIキーが無効です');
        } else if (error.response?.status === 404) {
          throw new Error('SeeDream: APIエンドポイントが見つかりません');
        } else if (error.response?.status === 429) {
          throw new Error('SeeDream: レート制限に達しました');
        } else if (error.response?.data?.detail) {
          throw new Error(`SeeDream: ${error.response.data.detail}`);
        }
      }

      throw new Error('SeeDream: 服装合成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
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