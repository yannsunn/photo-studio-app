/**
 * ローカルストレージ管理
 * 画像データの保存・取得・削除
 */

export interface SavedImage {
  id: string;
  personImage: string;
  garmentImage: string;
  resultImage: string;
  prompt?: string;
  createdAt: string;
  category?: 'tops' | 'bottoms' | 'accessories' | 'full' | 'other';
  tags?: string[];
}

export interface ReferenceImage {
  id: string;
  url: string;
  category: 'tops' | 'bottoms' | 'accessories' | 'shoes' | 'bags' | 'other';
  description: string;
  createdAt: string;
}

class StorageManager {
  private readonly SAVED_IMAGES_KEY = 'photo_studio_saved_images';
  private readonly REFERENCE_IMAGES_KEY = 'photo_studio_reference_images';
  private readonly MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB制限

  // 保存済み画像の取得
  getSavedImages(): SavedImage[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(this.SAVED_IMAGES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('保存済み画像の読み込みエラー:', error);
      return [];
    }
  }

  // 画像の保存
  saveImage(image: Omit<SavedImage, 'id' | 'createdAt'>): SavedImage {
    const newImage: SavedImage = {
      ...image,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    try {
      const images = this.getSavedImages();

      // ストレージサイズチェック
      const newData = JSON.stringify([...images, newImage]);
      if (new Blob([newData]).size > this.MAX_STORAGE_SIZE) {
        throw new Error('ストレージ容量が上限に達しました');
      }

      images.push(newImage);
      localStorage.setItem(this.SAVED_IMAGES_KEY, JSON.stringify(images));
      return newImage;
    } catch (error) {
      console.error('画像の保存エラー:', error);
      throw error;
    }
  }

  // 画像の削除
  deleteImage(id: string): boolean {
    try {
      const images = this.getSavedImages();
      const filtered = images.filter(img => img.id !== id);
      localStorage.setItem(this.SAVED_IMAGES_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('画像の削除エラー:', error);
      return false;
    }
  }

  // 参考画像の取得
  getReferenceImages(): ReferenceImage[] {
    if (typeof window === 'undefined') return this.getDefaultReferenceImages();
    try {
      const data = localStorage.getItem(this.REFERENCE_IMAGES_KEY);
      return data ? JSON.parse(data) : this.getDefaultReferenceImages();
    } catch (error) {
      console.error('参考画像の読み込みエラー:', error);
      return this.getDefaultReferenceImages();
    }
  }

  // 参考画像の追加
  addReferenceImage(image: Omit<ReferenceImage, 'id' | 'createdAt'>): ReferenceImage {
    const newImage: ReferenceImage = {
      ...image,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };

    try {
      const images = this.getReferenceImages();
      images.push(newImage);
      localStorage.setItem(this.REFERENCE_IMAGES_KEY, JSON.stringify(images));
      return newImage;
    } catch (error) {
      console.error('参考画像の追加エラー:', error);
      throw error;
    }
  }

  // デフォルト参考画像
  private getDefaultReferenceImages(): ReferenceImage[] {
    return [
      {
        id: 'ref-1',
        url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
        category: 'tops',
        description: 'クラシックな白シャツ',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ref-2',
        url: 'https://images.unsplash.com/photo-1584370848010-d7fe7a451b1d?w=400',
        category: 'bottoms',
        description: 'デニムジーンズ',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'ref-3',
        url: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400',
        category: 'accessories',
        description: 'レザーバッグ',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // ID生成
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ストレージサイズ取得
  getStorageSize(): { used: number; max: number; percentage: number } {
    try {
      const savedImages = JSON.stringify(this.getSavedImages());
      const referenceImages = JSON.stringify(this.getReferenceImages());
      const used = new Blob([savedImages, referenceImages]).size;

      return {
        used,
        max: this.MAX_STORAGE_SIZE,
        percentage: Math.round((used / this.MAX_STORAGE_SIZE) * 100),
      };
    } catch (error) {
      console.error('ストレージサイズ取得エラー:', error);
      return { used: 0, max: this.MAX_STORAGE_SIZE, percentage: 0 };
    }
  }

  // 全データクリア
  clearAllData(): boolean {
    try {
      localStorage.removeItem(this.SAVED_IMAGES_KEY);
      localStorage.removeItem(this.REFERENCE_IMAGES_KEY);
      return true;
    } catch (error) {
      console.error('データクリアエラー:', error);
      return false;
    }
  }
}

export const storage = new StorageManager();