'use client';

import { useState, useEffect } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ClothingGenerator from '@/components/ClothingGenerator';
import SavedImagesGallery from '@/components/SavedImagesGallery';
import DownloadOptionsModal from '@/components/DownloadOptionsModal';
import PoseEditor from '@/components/PoseEditor';
import BatchProcessor from '@/components/BatchProcessor';
import GarmentTypeSelector from '@/components/GarmentTypeSelector';
import { storage } from '@/lib/storage';

export default function Home() {
  const [personImage, setPersonImage] = useState<string>('');
  const [garmentImage, setGarmentImage] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');
  const [poseData, setPoseData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'create' | 'gallery' | 'batch'>('create');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showPoseEditor, setShowPoseEditor] = useState(false);
  // 高品質モードのみを使用（APIコストは同じ）
  const selectedApi = 'seeDream'; // 常に高品質モードを使用
  const [replacementMode, setReplacementMode] = useState<'replace' | 'overlay'>('replace');
  const [garmentType, setGarmentType] = useState<'upper' | 'lower' | 'dress' | 'outer'>('upper');
  const [preservePose, setPreservePose] = useState(true);

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
          replacementMode,
          garmentType,
          preservePose,
          poseData: poseData, // ポーズデータを追加
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process images');
      }

      if (data.images && data.images.length > 0) {
        setResultImage(data.images[0].url);
        // 保存ダイアログは手動で開くようにする（自動表示しない）
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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Modern gradient background overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Modern Header with glassmorphism */}
        <header className="relative mb-6 sm:mb-8 lg:mb-12">
          <div className="backdrop-blur-lg bg-white/70 dark:bg-slate-900/70 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10m-7 5h4" />
                    </svg>
                  </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                    バーチャルスタジオ
                  </h1>
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* Modern Tab Navigation with animation */}
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
          <div className="backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 rounded-full shadow-lg p-1.5 border border-white/20">
            <div className="relative flex gap-1">
              {/* Animated background */}
              <div
                className={`absolute inset-y-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 shadow-lg transition-all duration-300 ease-out ${
                  activeTab === 'create' ? 'w-[calc(33.333%-0.125rem)]' :
                  activeTab === 'gallery' ? 'w-[calc(33.333%-0.125rem)] translate-x-[calc(100%+0.25rem)]' :
                  'w-[calc(33.333%-0.125rem)] translate-x-[calc(200%+0.5rem)]'
                }`}
              />

              <button
                onClick={() => setActiveTab('create')}
                className={`relative flex-1 px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-colors duration-200 ${
                  activeTab === 'create'
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>作成</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('gallery')}
                className={`relative flex-1 px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-colors duration-200 ${
                  activeTab === 'gallery'
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>ギャラリー</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('batch')}
                className={`relative flex-1 px-6 py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-colors duration-200 ${
                  activeTab === 'batch'
                    ? 'text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>バッチ処理</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'create' ? (
            <>
              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8">
                {/* Main Editor with modern card design */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                  <div className="backdrop-blur-lg bg-white/90 dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-white/20">
                    {/* Modern Image Upload Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      {/* Person Image Upload with modern styling */}
                      <div className="group">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">人物写真</span>
                        </div>
                        <ImageUploader
                          label=""
                          onImageSelect={setPersonImage}
                          currentImage={personImage}
                        />
                      </div>

                      {/* Garment Image Upload with modern styling */}
                      <div className="group">
                        <div className="mb-2 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10l-5 5m0 0l-5-5m5 5v6" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">服の写真</span>
                        </div>
                        <ImageUploader
                          label=""
                          onImageSelect={setGarmentImage}
                          currentImage={garmentImage}
                        />
                      </div>
                    </div>

                    {/* Garment Type Selector */}
                    <div className="mb-6">
                      <GarmentTypeSelector
                        value={garmentType}
                        onChange={setGarmentType}
                      />
                    </div>

                    {/* Pose Preservation Option */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">ポーズを保持</span>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              座っている・立っているなどの姿勢をそのまま維持します
                            </p>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={preservePose}
                            onChange={(e) => setPreservePose(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-14 h-7 rounded-full transition-colors duration-200 ${
                            preservePose ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                              preservePose ? 'translate-x-7' : 'translate-x-0.5'
                            } mt-0.5`} />
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Modern Mode Selector with sliding animation */}
                    <div className="mb-6 sm:mb-8">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          合成モード
                        </label>
                        <span className="text-xs px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium">
                          {replacementMode === 'replace' ? '完全置換' : 'レイヤー'}
                        </span>
                      </div>

                      <div className="relative p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                        <div className="relative flex gap-2">
                          {/* Animated selector background */}
                          <div
                            className={`absolute inset-y-1 rounded-xl bg-white dark:bg-slate-700 shadow-lg transition-all duration-300 ease-out ${
                              replacementMode === 'replace' ? 'w-[calc(50%-0.25rem)]' : 'w-[calc(50%-0.25rem)] translate-x-[calc(100%+0.5rem)]'
                            }`}
                          />

                          <button
                            onClick={() => setReplacementMode('replace')}
                            className={`relative flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                              replacementMode === 'replace'
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                              <span>完全置換</span>
                              {replacementMode === 'replace' && (
                                <span className="text-xs opacity-70">推奨</span>
                              )}
                            </div>
                          </button>

                          <button
                            onClick={() => setReplacementMode('overlay')}
                            className={`relative flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                              replacementMode === 'overlay'
                                ? 'text-slate-900 dark:text-white'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span>レイヤーモード</span>
                              {replacementMode === 'overlay' && (
                                <span className="text-xs opacity-70">アクセサリー</span>
                              )}
                            </div>
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3 italic">
                        {replacementMode === 'replace'
                          ? '既存の服を新しい服に完全に置き換えます'
                          : '既存の服の上にレイヤーとして追加します'}
                      </p>
                    </div>

                    {/* Modern Action Button with gradient */}
                    <div className="flex justify-center mb-6 sm:mb-8">
                      <button
                        onClick={handleSynthesize}
                        disabled={isProcessing || !personImage || !garmentImage}
                        className={`group relative px-8 sm:px-12 py-3 sm:py-4 rounded-2xl font-bold text-white transition-all duration-300 transform ${
                          isProcessing || !personImage || !garmentImage
                            ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed opacity-60'
                            : 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:shadow-2xl hover:shadow-violet-500/25 hover:scale-105 active:scale-100'
                        }`}
                      >
                        {/* Button glow effect */}
                        {!(isProcessing || !personImage || !garmentImage) && (
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                        )}

                        <span className="relative flex items-center justify-center gap-3">
                          {isProcessing ? (
                            <>
                              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span className="text-sm sm:text-base">処理中...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-sm sm:text-base">着せ替え実行</span>
                            </>
                          )}
                        </span>
                      </button>
                    </div>

                    {/* Modern Error Display with animation */}
                    {error && (
                      <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-slide-in-up">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
                            </svg>
                          </div>
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                        </div>
                      </div>
                    )}

                    {/* Modern Result Display with animations */}
                    {resultImage && (
                      <div className="mt-6 sm:mt-8 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                            生成結果
                          </h2>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-xs text-slate-500">完了</span>
                          </div>
                        </div>

                        <div className="relative group">
                          {/* Modern image container with hover effects */}
                          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-2 sm:p-3">
                            <img
                              src={resultImage}
                              alt="Generated outfit"
                              className="w-full h-auto max-h-[600px] object-contain rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
                            />

                            {/* Floating action buttons with glassmorphism */}
                            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col sm:flex-row gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <button
                                onClick={() => setShowSaveDialog(true)}
                                className="backdrop-blur-lg bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 px-3 sm:px-4 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 transition-all duration-200 flex items-center gap-2 shadow-lg border border-white/20"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                                </svg>
                                <span className="text-sm font-medium">保存</span>
                              </button>

                              <button
                                onClick={() => setShowDownloadModal(true)}
                                className="backdrop-blur-lg bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-3 sm:px-4 py-2 rounded-xl hover:shadow-xl hover:shadow-violet-500/25 transition-all duration-200 flex items-center gap-2 shadow-lg"
                              >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="text-sm font-medium">エクスポート</span>
                              </button>
                            </div>
                          </div>

                          {/* Quick actions bar for mobile */}
                          <div className="flex gap-2 mt-3 sm:hidden">
                            <button
                              onClick={() => setShowSaveDialog(true)}
                              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-medium text-sm"
                            >
                              保存
                            </button>
                            <button
                              onClick={() => setShowDownloadModal(true)}
                              className="flex-1 bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-2 rounded-xl font-medium text-sm"
                            >
                              ダウンロード
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clothing Generator Sidebar with modern styling */}
                <div className="lg:col-span-1 order-1 lg:order-2">
                  <div className="sticky top-4">
                    <ClothingGenerator
                      onSelectImage={setGarmentImage}
                    />
                  </div>
                </div>
              </div>

              {/* Modern Instructions Card - Hidden on mobile by default */}
              <div className="hidden sm:block backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">クイックガイド</h3>
                </div>

                <div className="space-y-3">
                  {[
                    { icon: '📸', text: '人物写真をアップロードまたはURLを貼り付け' },
                    { icon: '👕', text: 'ギャラリーから服を選択またはアップロード' },
                    { icon: '⚡', text: '合成モードを選択（置換/レイヤー）' },
                    { icon: '✨', text: '生成ボタンをクリックして約15秒待つ' },
                    { icon: '💾', text: 'エンハンスメントで保存またはダウンロード' },
                  ].map((step, index) => (
                    <div key={index} className="flex items-start gap-3 group">
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm group-hover:bg-gradient-to-br group-hover:from-violet-100 group-hover:to-cyan-100 dark:group-hover:from-violet-900/30 dark:group-hover:to-cyan-900/30 transition-colors">
                        <span>{step.icon}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 pt-1">{step.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : activeTab === 'gallery' ? (
            <SavedImagesGallery />
          ) : (
            <BatchProcessor />
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

        {/* Download Options Modal */}
        {showDownloadModal && resultImage && (
          <DownloadOptionsModal
            imageUrl={resultImage}
            onClose={() => setShowDownloadModal(false)}
            onDownload={(url, filename) => {
              // ダウンロード処理
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              link.click();
            }}
          />
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