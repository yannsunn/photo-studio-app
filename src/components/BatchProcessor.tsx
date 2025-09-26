'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Package, Clock, DollarSign, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface BatchImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
}

interface BatchProcessorProps {
  onBatchComplete?: (results: BatchImage[]) => void;
}

export default function BatchProcessor({ onBatchComplete }: BatchProcessorProps) {
  const [images, setImages] = useState<BatchImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [priority, setPriority] = useState<'normal' | 'low'>('normal');
  const [enhancements, setEnhancements] = useState({
    colorCorrection: false,
    edgeOptimization: false,
  });

  // ファイル選択ハンドラー
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newImages: BatchImage[] = files.map(file => ({
      id: `img-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
    }));

    setImages(prev => [...prev, ...newImages]);

    // コスト計算
    const baseCost = 0.036;
    let cost = baseCost * (images.length + newImages.length);

    if (enhancements.colorCorrection) cost += 0.003 * (images.length + newImages.length);
    if (enhancements.edgeOptimization) cost += 0.004 * (images.length + newImages.length);

    // バッチ割引
    if (images.length + newImages.length >= 10) {
      cost *= 0.8; // 20%割引
    }

    // 低優先度割引
    if (priority === 'low') {
      cost *= 0.7; // 30%割引
    }

    setEstimatedCost(cost);
  }, [images.length, enhancements, priority]);

  // バッチ処理開始
  const startBatchProcessing = async () => {
    if (images.length === 0) return;

    setProcessing(true);

    try {
      // 画像をBase64に変換してアップロード
      const uploadPromises = images.map(async (img) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(img.file);
        });
      });

      const imageDataUrls = await Promise.all(uploadPromises);

      // バッチ処理APIを呼び出し
      const response = await fetch('/api/batch-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: imageDataUrls.map(url => ({
            imageUrl: url,
            mode: 'standard',
            enhancements: Object.keys(enhancements).filter(key => enhancements[key as keyof typeof enhancements]),
          })),
          priority,
        }),
      });

      if (!response.ok) {
        throw new Error('バッチ処理の開始に失敗しました');
      }

      const data = await response.json();
      setBatchId(data.batchId);

      // 定期的に状態をチェック
      const checkInterval = setInterval(async () => {
        const statusResponse = await fetch(`/api/batch-process?batchId=${data.batchId}`);
        const statusData = await statusResponse.json();

        // 画像の状態を更新
        setImages(prev => prev.map((img, idx) => {
          const task = statusData.tasks[idx];
          if (task) {
            return {
              ...img,
              status: task.status,
              resultUrl: task.status === 'completed' ? task.imageUrl : img.resultUrl,
            };
          }
          return img;
        }));

        // 全て完了したらインターバルをクリア
        const allCompleted = statusData.tasks.every((t: { status: string }) => t.status === 'completed' || t.status === 'failed');
        if (allCompleted) {
          clearInterval(checkInterval);
          setProcessing(false);
          if (onBatchComplete) {
            onBatchComplete(images);
          }
        }
      }, 3000); // 3秒ごとにチェック

    } catch (error) {
      console.error('Batch processing error:', error);
      setProcessing(false);

      // エラー時は全画像をfailedに
      setImages(prev => prev.map(img => ({
        ...img,
        status: 'failed',
        error: error instanceof Error ? error.message : '処理に失敗しました',
      })));
    }
  };

  // 画像削除
  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // クリア
  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    setBatchId(null);
    setEstimatedCost(0);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">バッチ処理</h2>
        <p className="text-gray-600">複数の画像を一括処理します（最大50枚）</p>
      </div>

      {/* オプション設定 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-3">処理オプション</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={enhancements.colorCorrection}
                onChange={(e) => setEnhancements(prev => ({ ...prev, colorCorrection: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span>色補正 (+$0.003/画像)</span>
            </label>
            <label className="flex items-center space-x-2 mt-2">
              <input
                type="checkbox"
                checked={enhancements.edgeOptimization}
                onChange={(e) => setEnhancements(prev => ({ ...prev, edgeOptimization: e.target.checked }))}
                className="w-4 h-4 text-blue-600"
              />
              <span>エッジ最適化 (+$0.004/画像)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              優先度
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'normal' | 'low')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="normal">通常（5-10秒/画像）</option>
              <option value="low">低優先度（30-60秒/画像、30%割引）</option>
            </select>
          </div>
        </div>
      </div>

      {/* ファイルアップロード */}
      <div className="mb-6">
        <label className="block w-full">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={processing}
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600">画像を選択またはドラッグ&ドロップ</p>
            <p className="text-sm text-gray-500 mt-1">複数選択可能（最大50枚）</p>
          </div>
        </label>
      </div>

      {/* 画像プレビュー */}
      {images.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">選択された画像 ({images.length}枚)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.preview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />

                {/* ステータスオーバーレイ */}
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  {img.status === 'pending' && <Clock className="w-6 h-6 text-white" />}
                  {img.status === 'processing' && <Loader2 className="w-6 h-6 text-white animate-spin" />}
                  {img.status === 'completed' && <CheckCircle className="w-6 h-6 text-green-400" />}
                  {img.status === 'failed' && <AlertCircle className="w-6 h-6 text-red-400" />}
                </div>

                {/* 削除ボタン */}
                {!processing && (
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* コスト表示 */}
      {images.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">推定コスト:</span>
              <span className="font-bold text-lg">${estimatedCost.toFixed(3)}</span>
            </div>
            {images.length >= 10 && (
              <span className="text-green-600 font-semibold">
                <Package className="inline w-4 h-4 mr-1" />
                バッチ割引適用中（-20%）
              </span>
            )}
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex space-x-4">
        <button
          onClick={startBatchProcessing}
          disabled={processing || images.length === 0}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? (
            <>
              <Loader2 className="inline w-5 h-5 mr-2 animate-spin" />
              処理中...
            </>
          ) : (
            '一括処理を開始'
          )}
        </button>

        <button
          onClick={clearAll}
          disabled={processing}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          クリア
        </button>
      </div>

      {/* バッチID表示 */}
      {batchId && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
          <span className="font-semibold">バッチID:</span> {batchId}
        </div>
      )}
    </div>
  );
}