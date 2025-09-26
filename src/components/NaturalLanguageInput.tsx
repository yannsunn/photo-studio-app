'use client';

import React, { useState } from 'react';
import { Wand2, Sparkles, Info } from 'lucide-react';

interface NaturalLanguageInputProps {
  onPromptChange: (prompt: string) => void;
  className?: string;
}

export default function NaturalLanguageInput({ onPromptChange, className = '' }: NaturalLanguageInputProps) {
  const [prompt, setPrompt] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  // プリセット例
  const examplePrompts = [
    {
      category: '服の変更',
      examples: [
        { text: '黒いスーツを着せる', icon: '🤵' },
        { text: '赤いドレスに変更', icon: '👗' },
        { text: '蝶ネクタイを追加', icon: '🎀' },
        { text: 'カジュアルなTシャツとジーンズ', icon: '👕' },
      ]
    },
    {
      category: 'スタイル変更',
      examples: [
        { text: 'フォーマルなビジネススタイルに', icon: '💼' },
        { text: 'スポーティーな服装に変更', icon: '🏃' },
        { text: '夏のビーチスタイル', icon: '🏖️' },
        { text: '冬の暖かい服装', icon: '🧥' },
      ]
    },
    {
      category: '細部の調整',
      examples: [
        { text: '帽子を追加', icon: '🎩' },
        { text: 'サングラスをかける', icon: '🕶️' },
        { text: 'ネクタイの色を青に', icon: '👔' },
        { text: 'アクセサリーを追加', icon: '💎' },
      ]
    },
    {
      category: 'ポーズ・位置調整',
      examples: [
        { text: '人物を中央に配置', icon: '🎯' },
        { text: '背景をぼかす', icon: '🌆' },
        { text: '明るく調整', icon: '☀️' },
        { text: 'プロフェッショナルな雰囲気に', icon: '📸' },
      ]
    }
  ];

  const handleExampleClick = (exampleText: string) => {
    setPrompt(exampleText);
    onPromptChange(exampleText);
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    onPromptChange(value);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Wand2 className="w-4 h-4 text-violet-600" />
            自然言語での指示
          </label>
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            {showExamples ? '例を隠す' : '例を見る'}
          </button>
        </div>

        {/* テキストエリア */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            placeholder="例：黒いスーツを着せる、蝶ネクタイを追加、人物を中央に配置..."
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-400 focus:outline-none resize-none transition-colors"
            rows={3}
          />
          {prompt && (
            <button
              type="button"
              onClick={() => handlePromptChange('')}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* 使い方のヒント */}
        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-semibold mb-1">💡 使い方のヒント:</p>
              <ul className="space-y-0.5">
                <li>• 服装の変更: 「黒いスーツ」「赤いドレス」など</li>
                <li>• アクセサリー追加: 「蝶ネクタイ」「帽子」「サングラス」など</li>
                <li>• スタイル指定: 「フォーマル」「カジュアル」「スポーティー」など</li>
                <li>• 複合指示: 「黒いスーツに赤いネクタイ」なども可能</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 例の表示 */}
      {showExamples && (
        <div className="space-y-4 animate-fade-in">
          {examplePrompts.map((category, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-xl">
              <h4 className="font-semibold text-sm text-gray-700 mb-3">{category.category}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {category.examples.map((example, exIdx) => (
                  <button
                    key={exIdx}
                    type="button"
                    onClick={() => handleExampleClick(example.text)}
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg hover:bg-violet-50 hover:border-violet-200 border border-gray-200 transition-all text-left"
                  >
                    <span className="text-lg">{example.icon}</span>
                    <span className="text-sm text-gray-700">{example.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 選択中のプロンプト表示 */}
      {prompt && (
        <div className="mt-4 p-3 bg-violet-50 rounded-lg border border-violet-200">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-medium text-violet-700">現在の指示:</span>
          </div>
          <p className="mt-1 text-sm text-violet-800">{prompt}</p>
        </div>
      )}
    </div>
  );
}