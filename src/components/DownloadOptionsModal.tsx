'use client';

import { useState } from 'react';

interface DownloadOptionsModalProps {
  imageUrl: string;
  onClose: () => void;
  onDownload: (url: string, filename: string) => void;
}

export default function DownloadOptionsModal({
  imageUrl,
  onClose,
  onDownload
}: DownloadOptionsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [options, setOptions] = useState({
    upscale: false,
    upscaleFactor: 2 as 2 | 4,
    removeBackground: false,
    enhanceQuality: true,
  });

  const handleEnhanceAndDownload = async () => {
    setIsProcessing(true);

    try {
      // エンハンスメント処理が必要な場合
      if (options.upscale || options.removeBackground || options.enhanceQuality) {
        const response = await fetch('/api/enhance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl,
            enhancements: options
          }),
        });

        if (!response.ok) {
          throw new Error('画像処理に失敗しました');
        }

        const data = await response.json();

        // エンハンス済み画像をダウンロード
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `enhanced-outfit-${timestamp}.png`;
        onDownload(data.enhancedUrl, filename);
      } else {
        // エンハンスメントなしで直接ダウンロード
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `outfit-${timestamp}.png`;
        onDownload(imageUrl, filename);
      }

      onClose();
    } catch (error) {
      console.error('Download error:', error);
      alert('ダウンロードに失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectDownload = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `outfit-${timestamp}.png`;
    onDownload(imageUrl, filename);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">ダウンロードオプション</h3>

        <div className="space-y-4 mb-6">
          {/* アップスケール */}
          <div className="border rounded-lg p-3">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="upscale"
                checked={options.upscale}
                onChange={(e) => setOptions({ ...options, upscale: e.target.checked })}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <label htmlFor="upscale" className="font-medium text-sm cursor-pointer">
                  アップスケール（高解像度化）
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  AIで画像を高解像度化します
                </p>
                {options.upscale && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setOptions({ ...options, upscaleFactor: 2 })}
                      className={`px-3 py-1 text-xs rounded ${
                        options.upscaleFactor === 2
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      2倍
                    </button>
                    <button
                      onClick={() => setOptions({ ...options, upscaleFactor: 4 })}
                      className={`px-3 py-1 text-xs rounded ${
                        options.upscaleFactor === 4
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      4倍
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 画質向上 */}
          <div className="border rounded-lg p-3">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="enhanceQuality"
                checked={options.enhanceQuality}
                onChange={(e) => setOptions({ ...options, enhanceQuality: e.target.checked })}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <label htmlFor="enhanceQuality" className="font-medium text-sm cursor-pointer">
                  画質向上
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  ノイズ除去とシャープネスを適用
                </p>
              </div>
            </div>
          </div>

          {/* 背景除去 */}
          <div className="border rounded-lg p-3">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="removeBackground"
                checked={options.removeBackground}
                onChange={(e) => setOptions({ ...options, removeBackground: e.target.checked })}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <label htmlFor="removeBackground" className="font-medium text-sm cursor-pointer">
                  背景を削除
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  透明背景のPNG画像として保存
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 処理時間の目安 */}
        {(options.upscale || options.removeBackground || options.enhanceQuality) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700">
              <span className="font-semibold">処理時間の目安:</span>
              {options.upscale && options.upscaleFactor === 4 ? ' 20-30秒' : ' 10-20秒'}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleEnhanceAndDownload}
            disabled={isProcessing}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                処理中...
              </span>
            ) : (
              '処理してダウンロード'
            )}
          </button>

          <button
            onClick={handleDirectDownload}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            そのままダウンロード
          </button>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}