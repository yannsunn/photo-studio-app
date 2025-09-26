'use client';

import { useState, useEffect } from 'react';
import { storage, ReferenceImage } from '@/lib/storage';

const CLOTHING_TEMPLATES = {
  tops: [
    { en: 'White Silk Blouse', ja: 'エレガントな白いブラウス', icon: '👔' },
    { en: 'Casual T-Shirt', ja: 'カジュアルなTシャツ', icon: '👕' },
    { en: 'Formal Jacket', ja: 'フォーマルなジャケット', icon: '🧥' },
    { en: 'Knit Sweater', ja: 'ニットセーター', icon: '🧶' },
    { en: 'Hoodie', ja: 'パーカー', icon: '🎽' },
  ],
  bottoms: [
    { en: 'Skinny Jeans', ja: 'スキニージーンズ', icon: '👖' },
    { en: 'Pleated Skirt', ja: 'プリーツスカート', icon: '🩱' },
    { en: 'Chino Pants', ja: 'チノパンツ', icon: '👔' },
    { en: 'Shorts', ja: 'ショートパンツ', icon: '🩳' },
    { en: 'Wide Pants', ja: 'ワイドパンツ', icon: '👖' },
  ],
  accessories: [
    { en: 'Leather Bag', ja: 'レザーバッグ', icon: '👜' },
    { en: 'Sunglasses', ja: 'サングラス', icon: '🕶️' },
    { en: 'Necklace', ja: 'ネックレス', icon: '📿' },
    { en: 'Scarf', ja: 'スカーフ', icon: '🧣' },
    { en: 'Watch', ja: '腕時計', icon: '⌚' },
  ],
  shoes: [
    { en: 'Sneakers', ja: 'スニーカー', icon: '👟' },
    { en: 'High Heels', ja: 'ハイヒール', icon: '👠' },
    { en: 'Boots', ja: 'ブーツ', icon: '🥾' },
    { en: 'Sandals', ja: 'サンダル', icon: '👡' },
    { en: 'Loafers', ja: 'ローファー', icon: '👞' },
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
          prompt: customPrompt || CLOTHING_TEMPLATES[selectedCategory][0].en,
          category: selectedCategory,
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        // 参考画像として保存（LocalStorageに永続化）
        const newImage = storage.addReferenceImage({
          url: data.imageUrl,
          category: selectedCategory as 'tops' | 'bottoms' | 'accessories' | 'shoes' | 'bags' | 'other',
          description: customPrompt || CLOTHING_TEMPLATES[selectedCategory][0].en,
        });

        // 生成された画像リストに追加
        setGeneratedImages(prev => [newImage, ...prev]);

        // 全体のリストを再読み込み
        loadReferenceImages();

        alert(`参考画像を生成してライブラリに保存しました: ${newImage.description}`);
      }
    } catch (error) {
      console.error('画像生成エラー:', error);
      alert('スタイルライブラリの生成に失敗しました');
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
    <div className="backdrop-blur-lg bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10l-5 13m0 0l-5-13m5 13v-6" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">スタイルライブラリ</h2>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-cyan-100 to-violet-100 dark:from-cyan-900/30 dark:to-violet-900/30 text-cyan-700 dark:text-cyan-300 font-medium">
          AI搭載
        </span>
      </div>

      {/* Modern Category Selection */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
          カテゴリ
        </label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries({
            tops: { label: 'トップス', icon: '👕' },
            bottoms: { label: 'ボトムス', icon: '👖' },
            accessories: { label: 'アクセ', icon: '💎' },
            shoes: { label: 'シューズ', icon: '👟' }
          }).map(([key, { label, icon }]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as keyof typeof CLOTHING_TEMPLATES)}
              className={`relative px-3 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                selectedCategory === key
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/25 scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modern Template Selection */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
          クイック選択
        </label>
        <select
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          onChange={(e) => setCustomPrompt(e.target.value)}
        >
          <option value="">スタイルを選択...</option>
          {CLOTHING_TEMPLATES[selectedCategory].map((template, idx) => (
            <option key={idx} value={template.en}>
              {template.icon} {template.ja}
            </option>
          ))}
        </select>
      </div>

      {/* Modern Custom Prompt */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
          カスタム説明
        </label>
        <div className="relative">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="例：赤いチェック柄シャツ、カジュアルスタイル..."
            className="w-full px-3 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all"
            rows={2}
          />
          <div className="absolute right-2 top-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Modern Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !customPrompt}
        className={`group w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
          isGenerating || !customPrompt
            ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white hover:shadow-xl hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-100'
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          {isGenerating ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              生成中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              スタイル生成
            </>
          )}
        </span>
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

      {/* Modern Reference Gallery */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            スタイルギャラリー
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {referenceImages.length}
            </span>
          </h3>
          {referenceImages.length > 6 && (
            <button
              onClick={() => {
                if (confirm('Clear generated images? (Default images will remain)')) {
                  localStorage.removeItem('photo_studio_reference_images');
                  loadReferenceImages();
                  setGeneratedImages([]);
                }
              }}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
            >
              クリア
            </button>
          )}
        </div>
        {referenceImages.length === 0 ? (
          <div className="text-center py-8 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              まだ参考画像がありません
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              上記から最初のスタイルを生成してください
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/30">
            {referenceImages.map((img) => (
              <div
                key={img.id}
                className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 hover:scale-105 ${
                  selectedImageId === img.id
                    ? 'ring-2 ring-violet-500 shadow-lg shadow-violet-500/25'
                    : 'hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600'
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
                  <div className="absolute inset-0 bg-gradient-to-t from-violet-600/80 to-transparent flex items-end justify-center pb-1">
                    <span className="text-white text-xs font-bold">
                      ✓
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