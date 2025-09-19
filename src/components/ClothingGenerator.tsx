'use client';

import { useState, useEffect } from 'react';
import { storage, ReferenceImage } from '@/lib/storage';

const CLOTHING_TEMPLATES = {
  tops: [
    'エレガントな白いブラウス',
    'カジュアルなTシャツ',
    'フォーマルなジャケット',
    'ニットセーター',
    'パーカー',
  ],
  bottoms: [
    'スキニージーンズ',
    'プリーツスカート',
    'チノパンツ',
    'ショートパンツ',
    'ワイドパンツ',
  ],
  accessories: [
    'レザーバッグ',
    'サングラス',
    'ネックレス',
    'スカーフ',
    '腕時計',
  ],
  shoes: [
    'スニーカー',
    'ハイヒール',
    'ブーツ',
    'サンダル',
    'ローファー',
  ],
};

interface ClothingGeneratorProps {
  onSelectImage: (url: string) => void;
}

export default function ClothingGenerator({ onSelectImage }: ClothingGeneratorProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof CLOTHING_TEMPLATES>('tops');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<ReferenceImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!customPrompt && !selectedCategory) return;

    setIsGenerating(true);
    try {
      // AI画像生成APIを呼び出す（仮の実装）
      const response = await fetch('/api/generate-clothing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: customPrompt || CLOTHING_TEMPLATES[selectedCategory][0],
          category: selectedCategory,
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        // 参考画像として保存（LocalStorageに永続化）
        const newImage = storage.addReferenceImage({
          url: data.imageUrl,
          category: selectedCategory as 'tops' | 'bottoms' | 'accessories' | 'shoes' | 'bags' | 'other',
          description: customPrompt || CLOTHING_TEMPLATES[selectedCategory][0],
        });

        // 生成された画像リストに追加
        setGeneratedImages(prev => [newImage, ...prev]);

        // 全体のリストを再読み込み
        loadReferenceImages();

        alert(`参考画像を生成してライブラリに保存しました: ${newImage.description}`);
      }
    } catch (error) {
      console.error('画像生成エラー:', error);
      alert('画像の生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);

  // 初回ロード時と生成時に参考画像を取得
  const loadReferenceImages = () => {
    if (typeof window !== 'undefined') {
      const images = storage.getReferenceImages();
      setReferenceImages(images);
    }
  };

  useEffect(() => {
    loadReferenceImages();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">参考服装を生成</h2>

      {/* カテゴリ選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          カテゴリを選択
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.keys(CLOTHING_TEMPLATES).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat as keyof typeof CLOTHING_TEMPLATES)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat === 'tops' && 'トップス'}
              {cat === 'bottoms' && 'ボトムス'}
              {cat === 'accessories' && 'アクセサリー'}
              {cat === 'shoes' && '靴'}
            </button>
          ))}
        </div>
      </div>

      {/* テンプレート選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          テンプレートから選択
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setCustomPrompt(e.target.value)}
        >
          <option value="">選択してください</option>
          {CLOTHING_TEMPLATES[selectedCategory].map((template, idx) => (
            <option key={idx} value={template}>{template}</option>
          ))}
        </select>
      </div>

      {/* カスタムプロンプト */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          または自由に説明
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="例: 赤いチェック柄のシャツ、カジュアルスタイル"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      {/* 生成ボタン */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !customPrompt}
        className={`w-full px-4 py-2 rounded-lg font-semibold text-white transition-all ${
          isGenerating || !customPrompt
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {isGenerating ? '生成中...' : '参考画像を生成'}
      </button>

      {/* 生成された画像 */}
      {generatedImages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">生成された画像</h3>
          <div className="grid grid-cols-2 gap-3">
            {generatedImages.map((img) => (
              <div
                key={img.id}
                className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                  selectedImageId === img.id ? 'border-blue-500' : 'border-gray-300'
                }`}
                onClick={() => {
                  setSelectedImageId(img.id);
                  onSelectImage(img.url);
                }}
              >
                <img
                  src={img.url}
                  alt={img.description}
                  className="w-full h-32 object-cover"
                />
                {selectedImageId === img.id && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                    選択中
                  </div>
                )}
                <div className="p-2 bg-white">
                  <p className="text-xs text-gray-600 truncate">{img.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 参考画像ギャラリー */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">参考画像ライブラリ ({referenceImages.length}件)</h3>
          {referenceImages.length > 3 && (
            <button
              onClick={() => {
                if (confirm('生成した画像をクリアしますか？（デフォルト画像は残ります）')) {
                  // デフォルト画像のIDを保持
                  const defaultIds = ['ref-1', 'ref-2', 'ref-3'];

                  // LocalStorageをクリアして再設定
                  localStorage.removeItem('photo_studio_reference_images');
                  loadReferenceImages();
                  setGeneratedImages([]);
                }
              }}
              className="text-xs text-red-600 hover:text-red-800"
            >
              生成画像をクリア
            </button>
          )}
        </div>
        {referenceImages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            参考画像がありません。上記のフォームから生成してください。
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {referenceImages.map((img) => (
            <div
              key={img.id}
              className={`relative cursor-pointer border-2 rounded-lg overflow-hidden ${
                selectedImageId === img.id ? 'border-blue-500' : 'border-transparent'
              }`}
              onClick={() => {
                setSelectedImageId(img.id);
                onSelectImage(img.url);
              }}
            >
              <img
                src={img.url}
                alt={img.description}
                className="w-full h-20 object-cover"
              />
              {selectedImageId === img.id && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold bg-blue-500 px-2 py-1 rounded">
                    選択中
                  </span>
                </div>
              )}
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}