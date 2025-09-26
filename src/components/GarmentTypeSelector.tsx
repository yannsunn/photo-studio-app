'use client';

import React from 'react';

interface GarmentTypeSelectorProps {
  value: 'upper' | 'lower' | 'dress' | 'outer';
  onChange: (type: 'upper' | 'lower' | 'dress' | 'outer') => void;
  className?: string;
}

export default function GarmentTypeSelector({ value, onChange, className = '' }: GarmentTypeSelectorProps) {
  const garmentTypes = [
    {
      id: 'upper',
      label: 'トップス',
      icon: '👔',
      description: 'シャツ・Tシャツ・ブラウス',
    },
    {
      id: 'lower',
      label: 'ボトムス',
      icon: '👖',
      description: 'パンツ・スカート・ショーツ',
    },
    {
      id: 'dress',
      label: 'ワンピース',
      icon: '👗',
      description: 'ドレス・ワンピース',
    },
    {
      id: 'outer',
      label: 'アウター',
      icon: '🧥',
      description: 'ジャケット・コート',
    },
  ];

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        着替える部位を選択
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {garmentTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id as 'upper' | 'lower' | 'dress' | 'outer')}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              ${value === type.id
                ? 'border-violet-500 bg-violet-50 shadow-lg scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl mb-2">{type.icon}</span>
              <span className={`font-semibold text-sm ${
                value === type.id ? 'text-violet-700' : 'text-gray-700'
              }`}>
                {type.label}
              </span>
              <span className={`text-xs mt-1 ${
                value === type.id ? 'text-violet-600' : 'text-gray-500'
              }`}>
                {type.description}
              </span>
            </div>

            {value === type.id && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">💡 ヒント:</span>
          {value === 'upper' && ' トップスのみを変更し、ボトムスは保持されます'}
          {value === 'lower' && ' ボトムスのみを変更し、トップスは保持されます'}
          {value === 'dress' && ' 全身の服装をワンピースに変更します'}
          {value === 'outer' && ' アウターのみを追加・変更し、インナーは保持されます'}
        </p>
      </div>
    </div>
  );
}