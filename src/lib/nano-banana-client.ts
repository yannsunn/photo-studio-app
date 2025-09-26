/**
 * Nano Banana (fal.ai) クライアント
 * セキュアな画像合成API実装
 */

import axios from 'axios';

// NanoBananaRequest interface is used for type checking the request payload
// interface NanoBananaRequest {
//   prompt: string;
//   image_urls: string[];
//   num_images?: number;
//   output_format?: 'jpeg' | 'png';
//   sync_mode?: boolean;
// }

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
    // APIキーから改行や不正な文字を除去
    this.apiKey = key.trim().replace(/[\r\n\t]/g, '');
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
      replacementMode?: 'replace' | 'overlay';
    } = {}
  ): Promise<NanoBananaResponse> {
    // Default prompt is not used - using specific clothing prompt instead
    // const defaultPrompt = `
    //   Combine the person in the first image with the clothing from the second image.
    //   Maintain the original pose and body position.
    //   Keep the original background unchanged.
    //   Ensure the clothing fits naturally.
    //   Create a realistic and natural-looking result.
    // `.trim();

    try {
      // Nano Banana (Gemini 2.5 Flash Image) を使用した服装変更
      // 人物画像と服の画像を組み合わせてプロンプトで指示

      // 服装変更用の詳細なプロンプトを作成（モードに応じて変更）
      let clothingPrompt: string;

      if (options.replacementMode === 'overlay') {
        // 重ね着モード
        clothingPrompt = `Add the garment from the second image as an additional layer on top of the person's existing clothing.
          IMPORTANT: Extract ONLY the CLOTHING/GARMENT from the second image, ignoring any person, face, or body in that image.
          Keep the FIRST person's face, pose, body position, background, and original clothing visible.
          Make it look like the FIRST person is wearing the new garment over their existing outfit.
          Ensure natural layering and realistic fit.`;
      } else {
        // 完全置き換えモード（デフォルト）
        clothingPrompt = `Completely replace the FIRST person's current clothing with the garment shown in the second image.
          CRITICAL: Extract ONLY the CLOTHING/GARMENT from the second image - ignore any face, person, or body that might be in the second image.
          The FIRST image contains the person whose clothing should be changed.
          The SECOND image is ONLY a reference for the clothing style/design to apply.
          Keep the FIRST person's exact face, facial features, hair, skin tone, pose, and body position unchanged.
          Remove all original clothing from the FIRST person and replace it with the garment style from the SECOND image.
          Make the new clothing fit naturally on the FIRST person's body.
          DO NOT use or merge any facial features or body parts from the second image - it is ONLY for clothing reference.`;
      }

      const requestPayload = {
        // Nano Bananaのパラメータ
        prompt: options.prompt || clothingPrompt,
        image_urls: [personImageUrl, garmentImageUrl],  // 人物と服の両方の画像を渡す
        num_images: options.numImages || 1,
        output_format: options.outputFormat || 'png',
        sync_mode: false  // 非同期モードでポーリング
      };

      // 正しいNano Banana Edit APIエンドポイントを使用
      const apiEndpoint = 'https://fal.run/fal-ai/nano-banana/edit';

      if (process.env.NODE_ENV === 'development') {
        console.log('Nano Banana: Submitting request to:', apiEndpoint);
        console.log('Nano Banana: Request body:', JSON.stringify(requestPayload, null, 2));
      }

      const submitResponse = await axios.post(
        apiEndpoint,
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
   * 自然言語による服装変更
   */
  async modifyWithNaturalLanguage(
    personImageUrl: string,
    languagePrompt: string,
    options: {
      numImages?: number;
      outputFormat?: 'jpeg' | 'png';
    } = {}
  ): Promise<NanoBananaResponse> {
    try {
      // 自然言語の指示をプロンプトに変換（顔の保持を強化）
      const modificationPrompt = `Modify the person's clothing in this image according to the following instructions: ${languagePrompt}
        CRITICAL: Keep the person's EXACT face, facial features, facial expression, eye shape, nose, mouth, and face structure UNCHANGED.
        Preserve the person's original identity, hair style, hair color, skin tone, and body shape EXACTLY as they are.
        Keep the person's pose, body position, and background exactly the same.
        FOCUS ONLY ON CLOTHING: The instructions refer ONLY to clothing/garments/accessories to change.
        If the instruction mentions any clothing item, apply it ONLY to the person's outfit, not their face or body.
        ONLY change what is explicitly mentioned in the instructions - typically clothing or accessories.
        DO NOT alter the person's face or identity in any way.
        Ensure the modifications look natural and realistic.
        Maintain the photo-realistic quality of the image.`;

      const requestPayload = {
        prompt: modificationPrompt,
        image_urls: [personImageUrl],  // 人物画像のみを使用
        num_images: options.numImages || 1,
        output_format: options.outputFormat || 'png',
        sync_mode: false
      };

      // 正しいNano Banana Edit APIエンドポイントを使用
      const apiEndpoint = 'https://fal.run/fal-ai/nano-banana/edit';

      if (process.env.NODE_ENV === 'development') {
        console.log('Nano Banana (Natural Language): Submitting request to:', apiEndpoint);
        console.log('Nano Banana (Natural Language): Request body:', JSON.stringify(requestPayload, null, 2));
      }

      const submitResponse = await axios.post(
        apiEndpoint,
        requestPayload,
        {
          headers: {
            'Authorization': `Key ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('NanoBanana (Natural Language): Submit response status:', submitResponse.status);
        console.log('NanoBanana (Natural Language): Submit response data:', JSON.stringify(submitResponse.data, null, 2));
      }

      // If sync_mode is enabled, return immediately
      if (submitResponse.data.images) {
        return submitResponse.data as NanoBananaResponse;
      }

      // Otherwise, poll for results
      const requestId = submitResponse.data.request_id;
      return await this.pollForResult(requestId);
    } catch (error) {
      console.error('Nano Banana API (Natural Language) error:', error);
      if (axios.isAxiosError(error)) {
        console.error('NanoBanana (Natural Language): Response status:', error.response?.status);
        console.error('NanoBanana (Natural Language): Response data:', error.response?.data);

        if (error.response?.status === 401) {
          throw new Error('NanoBanana: APIキーが無効です');
        } else if (error.response?.status === 404) {
          throw new Error('NanoBanana: APIエンドポイントが見つかりません');
        } else if (error.response?.status === 429) {
          throw new Error('NanoBanana: レート制限に達しました');
        }
      }
      throw new Error('自然言語による服装変更に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * URLの検証
   */
  static validateImageUrl(url: string): boolean {
    // 空文字チェック
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