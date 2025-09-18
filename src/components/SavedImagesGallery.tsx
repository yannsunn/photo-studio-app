'use client';

import { useState, useEffect } from 'react';
import { storage, SavedImage } from '@/lib/storage';

export default function SavedImagesGallery() {
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const [storageInfo, setStorageInfo] = useState({ used: 0, max: 0, percentage: 0 });

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = () => {
    setSavedImages(storage.getSavedImages());
    setStorageInfo(storage.getStorageSize());
  };

  const handleDelete = (id: string) => {
    if (confirm('この画像を削除してもよろしいですか？')) {
      if (storage.deleteImage(id)) {
        loadImages();
        setSelectedImage(null);
      }
    }
  };

  const handleDownload = (image: SavedImage) => {
    const link = document.createElement('a');
    link.href = image.resultImage;
    link.download = `outfit-${image.id}.png`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">保存済み画像</h2>
        <div className="text-sm text-gray-600">
          ストレージ: {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.max)}
          ({storageInfo.percentage}%)
        </div>
      </div>

      {savedImages.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          保存された画像はありません
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {savedImages.map((image) => (
            <div
              key={image.id}
              className="relative group cursor-pointer border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              onClick={() => setSelectedImage(image)}
            >
              <img
                src={image.resultImage}
                alt="保存済み画像"
                className="w-full h-40 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2 text-white text-xs">
                  <p>{formatDate(image.createdAt)}</p>
                  {image.category && (
                    <span className="inline-block px-2 py-1 bg-blue-500 rounded mt-1">
                      {image.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 詳細モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">画像詳細</h3>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">人物画像</p>
                  <img
                    src={selectedImage.personImage}
                    alt="人物"
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">服装画像</p>
                  <img
                    src={selectedImage.garmentImage}
                    alt="服装"
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">合成結果</p>
                  <img
                    src={selectedImage.resultImage}
                    alt="結果"
                    className="w-full h-48 object-cover rounded"
                  />
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">作成日時: {formatDate(selectedImage.createdAt)}</p>
                {selectedImage.category && (
                  <p className="text-sm text-gray-600">カテゴリ: {selectedImage.category}</p>
                )}
                {selectedImage.tags && selectedImage.tags.length > 0 && (
                  <p className="text-sm text-gray-600">
                    タグ: {selectedImage.tags.join(', ')}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  ダウンロード
                </button>
                <button
                  onClick={() => handleDelete(selectedImage.id)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}