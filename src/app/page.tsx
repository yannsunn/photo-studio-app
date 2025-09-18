'use client';

import { useState } from 'react';
import ImageUploader from '@/components/ImageUploader';

export default function Home() {
  const [personImage, setPersonImage] = useState<string>('');
  const [garmentImage, setGarmentImage] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process images');
      }

      if (data.images && data.images.length > 0) {
        setResultImage(data.images[0].url);
      }
    } catch (err: unknown) {
      console.error('Synthesis error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            写真館 着せ替えアプリ
          </h1>
          <p className="text-lg text-gray-600">
            AIを使って服装を自由に変更できます
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
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
                  <a
                    href={resultImage}
                    download="synthesized-outfit.png"
                    className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    ダウンロード
                  </a>
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

          {/* Instructions */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">使い方</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>人物写真をアップロードまたはURLで指定</li>
              <li>着せたい服の画像をアップロードまたはURLで指定</li>
              <li>「着せ替え実行」ボタンをクリック</li>
              <li>AIが自動的に服を合成します</li>
            </ol>
            <p className="mt-4 text-sm text-gray-500">
              ※ 画像はセキュアに処理され、保存されません
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
