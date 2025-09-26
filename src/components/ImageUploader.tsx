'use client';

import React, { useState, useCallback } from 'react';
import { ImageUploadHelper } from '@/lib/image-upload';

interface ImageUploaderProps {
  label: string;
  onImageSelect: (url: string) => void;
  currentImage?: string;
}

export default function ImageUploader({
  label,
  onImageSelect,
  currentImage,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string>(currentImage || '');

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFile = useCallback(async (file: File) => {
    // 画像検証を改善
    const validation = ImageUploadHelper.validateImage(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsLoading(true);

    try {
      // 画像をリサイズして最適化
      const resizedDataURL = await ImageUploadHelper.resizeImage(file, 1024, 1024, 0.9);

      setPreview(resizedDataURL);
      onImageSelect(resizedDataURL);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('画像の処理に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [onImageSelect]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      await handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  }, [handleFile]);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  const handleUrlSubmit = () => {
    if (urlValue && (urlValue.startsWith('http://') || urlValue.startsWith('https://'))) {
      setPreview(urlValue);
      onImageSelect(urlValue);
      setShowUrlInput(false);
      setUrlValue('');
    } else if (urlValue) {
      alert('Please enter a valid URL');
    }
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {label}
        </label>
      )}

      <div
        className={`relative rounded-2xl transition-all duration-300 ${
          isDragging
            ? 'ring-4 ring-violet-500/50 bg-violet-50/50 dark:bg-violet-900/20'
            : 'bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-white/70 dark:hover:bg-slate-800/70'
        } border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg p-4 sm:p-6`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
              onClick={() => {
                setPreview('');
                onImageSelect('');
              }}
              className="absolute top-2 right-2 backdrop-blur-lg bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
              aria-label="画像を削除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="text-center py-4 sm:py-6">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-violet-500 border-t-transparent"></div>
                <p className="text-sm text-slate-500">処理中...</p>
              </div>
            ) : (
              <>
                {showUrlInput ? (
                  <div className="animate-slide-in-up">
                    <div className="flex gap-2 max-w-sm mx-auto">
                      <input
                        type="url"
                        value={urlValue}
                        onChange={(e) => setUrlValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                        autoFocus
                      />
                      <button
                        onClick={handleUrlSubmit}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-sm font-medium hover:shadow-lg transition-all"
                      >
                        読み込み
                      </button>
                      <button
                        onClick={() => {
                          setShowUrlInput(false);
                          setUrlValue('');
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 dark:from-violet-900/30 dark:to-cyan-900/30 flex items-center justify-center mb-3">
                        <svg className="w-8 h-8 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                        ここに画像をドラッグ＆ドロップ
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        または下のオプションを使用
                      </p>
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id={`file-input-${label || 'image'}`}
                    />

                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <label
                        htmlFor={`file-input-${label || 'image'}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        ファイルを選択
                      </label>

                      <button
                        onClick={() => setShowUrlInput(true)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        URLを使用
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}