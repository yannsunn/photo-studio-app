'use client';

import React, { useState } from 'react';

interface MultiGarmentSelectorProps {
  onImagesSelect: (images: GarmentSelection[]) => void;
  className?: string;
}

export interface GarmentSelection {
  type: 'upper' | 'lower' | 'outer';
  imageUrl: string;
  file?: File;
}

export default function MultiGarmentSelector({ onImagesSelect, className = '' }: MultiGarmentSelectorProps) {
  const [selections, setSelections] = useState<GarmentSelection[]>([]);
  const [activeTab, setActiveTab] = useState<'single' | 'multi'>('single');

  const garmentSlots = [
    {
      type: 'upper' as const,
      label: 'トップス',
      icon: '👔',
      description: 'シャツ・Tシャツなど',
      color: 'violet',
    },
    {
      type: 'lower' as const,
      label: 'ボトムス',
      icon: '👖',
      description: 'パンツ・スカートなど',
      color: 'blue',
    },
    {
      type: 'outer' as const,
      label: 'アウター',
      icon: '🧥',
      description: 'ジャケット・コートなど',
      color: 'indigo',
    },
  ];

  const handleFileSelect = (type: 'upper' | 'lower' | 'outer', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    const newSelection: GarmentSelection = {
      type,
      imageUrl,
      file,
    };

    // 既存の同じタイプの選択を置き換え
    const updatedSelections = selections.filter(s => s.type !== type);
    updatedSelections.push(newSelection);

    setSelections(updatedSelections);
    onImagesSelect(updatedSelections);
  };

  const removeSelection = (type: 'upper' | 'lower' | 'outer') => {
    const updatedSelections = selections.filter(s => s.type !== type);
    setSelections(updatedSelections);
    onImagesSelect(updatedSelections);
  };

  const getSelectionByType = (type: 'upper' | 'lower' | 'outer') => {
    return selections.find(s => s.type === type);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-2">複数箇所同時着替え</h3>
        <p className="text-sm text-gray-600">
          複数の服を同時に変更できます。変更したい部位の服をそれぞれアップロードしてください。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {garmentSlots.map((slot) => {
          const selection = getSelectionByType(slot.type);

          return (
            <div
              key={slot.type}
              className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${
                selection
                  ? `border-${slot.color}-400 bg-${slot.color}-50`
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{slot.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-700">{slot.label}</h4>
                    <p className="text-xs text-gray-500">{slot.description}</p>
                  </div>
                </div>
                {selection && (
                  <button
                    onClick={() => removeSelection(slot.type)}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* アップロードエリアまたはプレビュー */}
              {selection ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={selection.imageUrl}
                    alt={`${slot.label}画像`}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-${slot.color}-600/30 to-transparent`} />
                  <div className="absolute bottom-2 left-2">
                    <span className={`px-2 py-1 bg-${slot.color}-600 text-white text-xs rounded-full font-medium`}>
                      選択済み
                    </span>
                  </div>
                </div>
              ) : (
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(slot.type, e)}
                    className="hidden"
                  />
                  <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 transition-colors">
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-sm text-gray-500">画像を選択</span>
                  </div>
                </label>
              )}
            </div>
          );
        })}
      </div>

      {/* 選択状態サマリー */}
      {selections.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-green-700">
              {selections.length}箇所の変更が選択されています
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {selections.map((sel) => {
              const slot = garmentSlots.find(s => s.type === sel.type);
              return (
                <span
                  key={sel.type}
                  className={`px-3 py-1 bg-${slot?.color}-100 text-${slot?.color}-700 rounded-full text-sm font-medium`}
                >
                  {slot?.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 使い方の説明 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          使い方
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• トップスとボトムスを同時に変更可能</li>
          <li>• アウターを追加しながら他の服も変更可能</li>
          <li>• 選択しない部位はそのまま保持されます</li>
        </ul>
      </div>
    </div>
  );
}