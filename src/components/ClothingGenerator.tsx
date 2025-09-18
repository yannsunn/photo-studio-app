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
  // const [generatedImages, setGeneratedImages] = useState<string[]>([]);

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
        // 参考画像として保存
        const newImage = storage.addReferenceImage({
          url: data.imageUrl,
          category: selectedCategory as 'tops' | 'bottoms' | 'accessories' | 'shoes' | 'bags' | 'other',
          description: customPrompt || CLOTHING_TEMPLATES[selectedCategory][0],
        });

        // リストを更新
        setReferenceImages(prev => [newImage, ...prev]);

        // 自動的に選択
        onSelectImage(data.imageUrl);
        alert('参考画像を生成しました');
      }
    } catch (error) {
      console.error('画像生成エラー:', error);
      alert('画像の生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setReferenceImages(storage.getReferenceImages());
    }
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

      {/* 参考画像ギャラリー */}
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">参考画像</h3>
        <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          {referenceImages.map((img) => (
            <div
              key={img.id}
              className="relative group cursor-pointer"
              onClick={() => onSelectImage(img.url)}
            >
              <img
                src={img.url}
                alt={img.description}
                className="w-full h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 text-xs">
                  選択
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}