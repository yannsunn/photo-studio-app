/**
 * Nano Banana (fal.ai) クライアント
 * セキュアな画像合成API実装
 */

import axios from 'axios';

interface NanoBananaRequest {
  prompt: string;
  image_urls: string[];
  num_images?: number;
  output_format?: 'jpeg' | 'png';
  sync_mode?: boolean;
}

interface NanoBananaResponse {
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
  seed?: number;
  has_nsfw_concepts?: boolean[];
  request_id?: string;
  status?: string;
}

export class NanoBananaClient {
  private apiKey: string;
  private baseUrl = 'https://fal.run/fal-ai';

  constructor(apiKey?: string) {
    const key = apiKey || process.env.FAL_KEY;
    if (!key) {
      throw new Error('FAL_KEYが設定されていません');
    }
    this.apiKey = key;
  }

  /**
   * 服装合成を実行
   */
  async synthesizeOutfit(
    personImageUrl: string,
    garmentImageUrl: string,
    options: {
      prompt?: string;
      numImages?: number;
      outputFormat?: 'jpeg' | 'png';
    } = {}
  ): Promise<NanoBananaResponse> {
    const defaultPrompt = `
      Combine the person in the first image with the clothing from the second image.
      Maintain the original pose and body position.
      Keep the original background unchanged.
      Ensure the clothing fits naturally.
      Create a realistic and natural-looking result.
    `.trim();

    try {
      // Submit request - Nano BananaはVirtual Try-Onではなく画像編集API
      // FASHN Virtual Try-Onを使用するか、Nano Bananaの画像編集機能を使用
      const useVirtualTryOn = true; // Virtual Try-Onを使用

      const endpoint = useVirtualTryOn
        ? 'https://fal.run/fashn/tryon'  // FASHN Virtual Try-On API
        : `${this.baseUrl}/nano-banana/edit`;  // Nano Banana画像編集API

      const requestPayload = useVirtualTryOn
        ? {
            // FASHN Virtual Try-Onのパラメータ
            model_image: personImageUrl,
            garment_image: garmentImageUrl,
            num_samples: 1,
            guidance_scale: 7.5,
            num_inference_steps: 50
          }
        : {
            // Nano Banana画像編集のパラメータ
            prompt: options.prompt || defaultPrompt,
            image_url: personImageUrl,
            mask_url: null,  // 服の部分をマスク
            num_images: 1
          };

      if (process.env.NODE_ENV === 'development') {
        console.log('API: Submitting request to:', endpoint);
        console.log('API: Request body:', JSON.stringify(requestPayload, null, 2));
      }

      const submitResponse = await axios.post(
        endpoint,
        requestPayload,
        {
          headers: {
            'Authorization': `Key ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('NanoBanana: Submit response status:', submitResponse.status);
        console.log('NanoBanana: Submit response data:', JSON.stringify(submitResponse.data, null, 2));
      }

      // If sync_mode is enabled, return immediately
      if (submitResponse.data.images) {
        return submitResponse.data as NanoBananaResponse;
      }

      // Otherwise, poll for results
      const requestId = submitResponse.data.request_id;
      return await this.pollForResult(requestId);
    } catch (error) {
      console.error('Nano Banana API error:', error);
      if (axios.isAxiosError(error)) {
        console.error('NanoBanana: Response status:', error.response?.status);
        console.error('NanoBanana: Response data:', error.response?.data);
        console.error('NanoBanana: Request config:', {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        });

        if (error.response?.status === 401) {
          throw new Error('NanoBanana: APIキーが無効です');
        } else if (error.response?.status === 404) {
          throw new Error('NanoBanana: APIエンドポイントが見つかりません');
        } else if (error.response?.status === 429) {
          throw new Error('NanoBanana: レート制限に達しました');
        }
      }
      throw new Error('服装合成に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * ポーリングで結果を取得
   */
  private async pollForResult(
    requestId: string,
    maxAttempts = 60,
    interval = 2000
  ): Promise<NanoBananaResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/requests/${requestId}/status`,
          {
            headers: {
              'Authorization': `Key ${this.apiKey}`,
            },
          }
        );

        if (response.data.status === 'COMPLETED') {
          return response.data as NanoBananaResponse;
        }

        if (response.data.status === 'FAILED') {
          throw new Error('処理に失敗しました: ' + response.data.error);
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error: unknown) {
        if (axios.isAxiosError(error) && error.response?.status !== 202) {
          throw error;
        }
      }
    }

    throw new Error('結果の待機中にタイムアウトしました');
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
   * セキュリティチェック
   */
  static sanitizePrompt(prompt: string): string {
    // Remove potential injection attempts
    return prompt
      .replace(/[<>]/g, '')
      .substring(0, 1000); // Limit length
  }
}