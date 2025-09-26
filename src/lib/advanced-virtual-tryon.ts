/**
 * Advanced Virtual Try-On Implementation
 * 部分的な着替えとポーズ保持に対応
 */

export interface VirtualTryOnOptions {
  personImageUrl: string;
  garmentImageUrl: string;
  garmentType: 'upper' | 'lower' | 'dress' | 'outer';
  preservePose?: boolean;
  preserveBackground?: boolean;
  maskRegion?: 'upper_body' | 'lower_body' | 'full_body';
}

export class AdvancedVirtualTryOn {
  /**
   * 服のタイプに基づいてプロンプトを生成
   */
  static generatePrompt(options: VirtualTryOnOptions): string {
    const { garmentType, preservePose, preserveBackground, maskRegion } = options;

    let basePrompt = '';

    // 服のタイプごとの詳細な指示
    switch (garmentType) {
      case 'upper':
        basePrompt = `Replace ONLY the upper body clothing (shirt, top, blouse) with the garment from the second image.
                     Keep the original pants, skirt, or lower body clothing unchanged.
                     Maintain the exact same pose and body position.`;
        break;

      case 'lower':
        basePrompt = `Replace ONLY the lower body clothing (pants, skirt, shorts) with the garment from the second image.
                     Keep the original top, shirt, or upper body clothing unchanged.
                     Maintain the exact same pose and body position.`;
        break;

      case 'dress':
        basePrompt = `Replace the entire outfit with the dress from the second image.
                     Keep any outer layers (jacket, coat) if present.
                     Maintain the exact same pose and body position.`;
        break;

      case 'outer':
        basePrompt = `Add or replace ONLY the outer layer (jacket, coat, cardigan) with the garment from the second image.
                     Keep all inner clothing (shirt, pants) completely unchanged.
                     Maintain the exact same pose and body position.`;
        break;
    }

    // ポーズ保持の強調
    if (preservePose) {
      basePrompt += ` IMPORTANT: Preserve the exact pose including sitting, standing, or any body position.
                     Do not change the person's posture, arm positions, or leg positions.`;
    }

    // 背景保持
    if (preserveBackground) {
      basePrompt += ` Keep the background exactly as it is. Do not modify any background elements.`;
    }

    // マスク領域の指定
    if (maskRegion) {
      switch (maskRegion) {
        case 'upper_body':
          basePrompt += ` Focus modification only on the upper body area (above waist).`;
          break;
        case 'lower_body':
          basePrompt += ` Focus modification only on the lower body area (below waist).`;
          break;
        case 'full_body':
          basePrompt += ` Allow modifications to the full body clothing.`;
          break;
      }
    }

    // 品質向上の指示
    basePrompt += ` Ensure natural fabric draping, realistic shadows, and proper fit.
                   Maintain photo-realistic quality and natural lighting.`;

    return basePrompt;
  }

  /**
   * 服のカテゴリを自動検出
   */
  static detectGarmentType(description?: string, imageAnalysis?: any): 'upper' | 'lower' | 'dress' | 'outer' {
    if (!description && !imageAnalysis) return 'upper';

    const text = (description || '').toLowerCase();

    // アウター検出
    const outerKeywords = ['jacket', 'coat', 'blazer', 'cardigan', 'hoodie', 'ジャケット', 'コート', 'カーディガン', 'パーカー', 'アウター'];
    if (outerKeywords.some(keyword => text.includes(keyword))) {
      return 'outer';
    }

    // ワンピース・ドレス検出
    const dressKeywords = ['dress', 'ワンピース', 'ドレス', 'overall', 'オーバーオール', 'jumpsuit'];
    if (dressKeywords.some(keyword => text.includes(keyword))) {
      return 'dress';
    }

    // 下半身検出
    const lowerKeywords = ['pants', 'trousers', 'jeans', 'skirt', 'shorts', 'パンツ', 'ズボン', 'スカート', 'ジーンズ', 'ショーツ'];
    if (lowerKeywords.some(keyword => text.includes(keyword))) {
      return 'lower';
    }

    // デフォルトは上半身
    return 'upper';
  }

  /**
   * セグメンテーションマスクの生成（シミュレーション）
   */
  static generateSegmentationMask(
    garmentType: 'upper' | 'lower' | 'dress' | 'outer'
  ): {
    region: 'upper_body' | 'lower_body' | 'full_body';
    preserveRegions: string[];
  } {
    switch (garmentType) {
      case 'upper':
        return {
          region: 'upper_body',
          preserveRegions: ['legs', 'shoes', 'lower_clothing']
        };

      case 'lower':
        return {
          region: 'lower_body',
          preserveRegions: ['torso', 'arms', 'upper_clothing']
        };

      case 'dress':
        return {
          region: 'full_body',
          preserveRegions: ['head', 'arms', 'shoes', 'outer_layers']
        };

      case 'outer':
        return {
          region: 'upper_body',
          preserveRegions: ['inner_clothing', 'pants', 'shirt']
        };

      default:
        return {
          region: 'full_body',
          preserveRegions: []
        };
    }
  }

  /**
   * ポーズ検出のためのキーポイント
   */
  static detectPoseKeypoints(imageUrl: string): {
    isSitting: boolean;
    isStanding: boolean;
    armPosition: 'up' | 'down' | 'side';
    bodyAngle: number;
  } {
    // 実際の実装では、OpenPoseやMediaPipeを使用
    // ここではシミュレーション
    return {
      isSitting: false,
      isStanding: true,
      armPosition: 'down',
      bodyAngle: 0
    };
  }

  /**
   * 高度な合成リクエストの構築
   */
  static buildAdvancedRequest(options: VirtualTryOnOptions) {
    const { garmentType } = options;
    const prompt = this.generatePrompt(options);
    const mask = this.generateSegmentationMask(garmentType);

    return {
      prompt,
      maskRegion: mask.region,
      preserveRegions: mask.preserveRegions,
      processingMode: 'advanced',
      qualityLevel: 'high',
      inferenceSteps: 50, // 高品質のため増やす
      guidanceScale: 7.5,
      preservePose: true,
      preserveBackground: true,
    };
  }
}