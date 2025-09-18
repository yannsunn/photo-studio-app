/**
 * 画像アップロードヘルパー
 * Data URLを実際のURLに変換（将来的にクラウドストレージ対応）
 */

export class ImageUploadHelper {
  /**
   * Data URLをBlobに変換
   */
  static dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }

  /**
   * 画像をリサイズ
   */
  static async resizeImage(
    file: File | Blob,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
    quality: number = 0.9
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          // アスペクト比を保ちながらリサイズ
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // 圧縮してData URLとして出力
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onload = () => {
                  resolve(reader.result as string);
                };
                reader.readAsDataURL(blob);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * 画像の妥当性チェック
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    // ファイルタイプチェック
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: '画像ファイルを選択してください' };
    }

    // サイズチェック（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'ファイルサイズは10MB以下にしてください' };
    }

    // 対応フォーマットチェック
    const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!supportedFormats.includes(file.type)) {
      return { valid: false, error: '対応フォーマット: JPEG, PNG, WebP, GIF' };
    }

    return { valid: true };
  }

  /**
   * 将来的なクラウドアップロード機能のプレースホルダー
   */
  static async uploadToCloud(dataURL: string): Promise<string> {
    // 現在はData URLをそのまま返す
    // 将来的にはCloudinary, S3などへのアップロードを実装
    return dataURL;
  }
}