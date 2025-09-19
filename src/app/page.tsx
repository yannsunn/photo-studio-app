'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ClothingGenerator from '@/components/ClothingGenerator';
import SavedImagesGallery from '@/components/SavedImagesGallery';
import { storage } from '@/lib/storage';

export default function Home() {
  const [personImage, setPersonImage] = useState<string>('');
  const [garmentImage, setGarmentImage] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedApi, setSelectedApi] = useState<'nanoBanana' | 'seaDream'>('nanoBanana');

  const handleSynthesize = async () => {
    if (!personImage || !garmentImage) {
      setError('人物写真と服の画像を両方選択してください');
      return;
    }

    setIsProcessing(true);
    setError('');
    setResultImage('');

    try {
      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personImageUrl: personImage,
          garmentImageUrl: garmentImage,
          apiType: selectedApi,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process images');
      }

      if (data.images && data.images.length > 0) {
        setResultImage(data.images[0].url);
        // 画像が完全に読み込まれるのを待ってから保存ダイアログを表示
        const img = new Image();
        img.onload = () => {
          setShowSaveDialog(true);
        };
        img.onerror = () => {
          setError('画像の読み込みに失敗しました');
        };
        img.src = data.images[0].url;
      }
    } catch (err: unknown) {
      console.error('Synthesis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveImage = (save: boolean) => {
    if (save && resultImage) {
      try {
        storage.saveImage({
          personImage,
          garmentImage,
          resultImage,
          category: 'full',
        });
        alert('画像を保存しました');
      } catch (error) {
        alert('保存に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
    setShowSaveDialog(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            写真館 着せ替えアプリ
          </h1>
          <p className="text-lg text-gray-600">
            AIを使って服装を自由に変更できます
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex gap-2 bg-white rounded-lg shadow p-1">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              新規作成
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              保存済み画像
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'create' ? (
            <>
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Main Editor */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                      {/* Person Image Upload */}
                      <div>
                        <ImageUploader
                          label="人物写真"
                          onImageSelect={setPersonImage}
                          currentImage={personImage}
                        />
                      </div>

                      {/* Garment Image Upload */}
                      <div>
                        <ImageUploader
                          label="服の画像"
                          onImageSelect={setGarmentImage}
                          currentImage={garmentImage}
                        />
                      </div>
                    </div>

                    {/* API Selector */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                        使用するAIエンジン
                      </label>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => setSelectedApi('nanoBanana')}
                          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            selectedApi === 'nanoBanana'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          Nano Banana
                          <span className="text-xs ml-1">(高速)</span>
                        </button>
                        <button
                          onClick={() => setSelectedApi('seaDream')}
                          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            selectedApi === 'seaDream'
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          SEA DREAM
                          <span className="text-xs ml-1">(高品質)</span>
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        {selectedApi === 'nanoBanana'
                          ? 'Nano Banana: 高速処理、多様なスタイルに対応'
                          : 'SEA DREAM: 高品質な合成、リアルな仕上がり'}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="text-center mb-8">
                      <button
                        onClick={handleSynthesize}
                        disabled={isProcessing || !personImage || !garmentImage}
                        className={`px-8 py-3 rounded-lg font-semibold text-white transition-all transform ${
                          isProcessing || !personImage || !garmentImage
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
                        }`}
                      >
                        {isProcessing ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            処理中...
                          </span>
                        ) : (
                          '着せ替え実行'
                        )}
                      </button>
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600">{error}</p>
                      </div>
                    )}

                    {/* Result Display */}
                    {resultImage && (
                      <div className="mt-8">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
                          合成結果
                        </h2>
                        <div className="relative bg-gray-100 rounded-lg p-4">
                          <img
                            src={resultImage}
                            alt="結果"
                            className="w-full h-auto max-h-[600px] object-contain rounded"
                          />
                          <div className="absolute top-4 right-4 flex gap-2">
                            <button
                              onClick={() => setShowSaveDialog(true)}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                              </svg>
                              保存
                            </button>
                            <a
                              href={resultImage}
                              download="synthesized-outfit.png"
                              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              ダウンロード
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clothing Generator Sidebar */}
                <div className="lg:col-span-1">
                  <ClothingGenerator
                    onSelectImage={setGarmentImage}
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">使い方</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>人物写真をアップロードまたはURLで指定</li>
                  <li>服の画像を選択（アップロード、URL、または参考画像から選択）</li>
                  <li>「着せ替え実行」ボタンをクリック</li>
                  <li>AIが自動的に服を合成します</li>
                  <li>結果を保存またはダウンロード</li>
                </ol>
              </div>
            </>
          ) : (
            <SavedImagesGallery />
          )}
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-4">画像を保存しますか？</h3>
              <p className="text-gray-600 mb-6">
                この画像をギャラリーに保存して、後で確認できるようにします。
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveImage(true)}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  保存する
                </button>
                <button
                  onClick={() => handleSaveImage(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  保存しない
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-sm mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
              <p className="text-center mt-4 text-gray-700">
                画像を合成中です...
                <br />
                <span className="text-sm text-gray-500">
                  処理には10〜30秒かかる場合があります
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}