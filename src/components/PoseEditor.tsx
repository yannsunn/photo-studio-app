'use client';

import { useState, useRef, useEffect } from 'react';

interface PoseEditorProps {
  onPoseUpdate: (poseData: string) => void;
}

export default function PoseEditor({ onPoseUpdate }: PoseEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
  const [showGuide, setShowGuide] = useState(true);

  // ポーズプリセット
  const posePresets = [
    { name: '立ちポーズ', id: 'standing' },
    { name: '座りポーズ', id: 'sitting' },
    { name: '歩きポーズ', id: 'walking' },
    { name: '手を上げる', id: 'hands_up' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスを白で初期化
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ガイド線を描画
    if (showGuide) {
      drawGuideLines(ctx, canvas.width, canvas.height);
    }
  }, [showGuide]);

  const drawGuideLines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // 人体プロポーションのガイドライン
    // 頭部
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.15, 25, 0, Math.PI * 2);
    ctx.stroke();

    // 胴体
    ctx.beginPath();
    ctx.moveTo(width / 2, height * 0.2);
    ctx.lineTo(width / 2, height * 0.5);
    ctx.stroke();

    // 腕
    ctx.beginPath();
    ctx.moveTo(width / 2 - 40, height * 0.25);
    ctx.lineTo(width / 2, height * 0.25);
    ctx.lineTo(width / 2 + 40, height * 0.25);
    ctx.stroke();

    // 脚
    ctx.beginPath();
    ctx.moveTo(width / 2, height * 0.5);
    ctx.lineTo(width / 2 - 20, height * 0.8);
    ctx.moveTo(width / 2, height * 0.5);
    ctx.lineTo(width / 2 + 20, height * 0.8);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
    } else {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 10;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveCanvasData();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showGuide) {
      drawGuideLines(ctx, canvas.width, canvas.height);
    }
  };

  const saveCanvasData = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onPoseUpdate(dataUrl);
  };

  const loadPreset = (presetId: string) => {
    // プリセットポーズを描画する処理
    clearCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;

    const width = canvas.width;
    const height = canvas.height;

    switch (presetId) {
      case 'standing':
        // 立ちポーズを描画
        ctx.beginPath();
        // 頭
        ctx.arc(width / 2, height * 0.15, 20, 0, Math.PI * 2);
        // 胴体
        ctx.moveTo(width / 2, height * 0.2);
        ctx.lineTo(width / 2, height * 0.5);
        // 腕
        ctx.moveTo(width / 2, height * 0.25);
        ctx.lineTo(width / 2 - 30, height * 0.4);
        ctx.moveTo(width / 2, height * 0.25);
        ctx.lineTo(width / 2 + 30, height * 0.4);
        // 脚
        ctx.moveTo(width / 2, height * 0.5);
        ctx.lineTo(width / 2 - 15, height * 0.75);
        ctx.moveTo(width / 2, height * 0.5);
        ctx.lineTo(width / 2 + 15, height * 0.75);
        ctx.stroke();
        break;

      case 'hands_up':
        // 手を上げるポーズ
        ctx.beginPath();
        // 頭
        ctx.arc(width / 2, height * 0.15, 20, 0, Math.PI * 2);
        // 胴体
        ctx.moveTo(width / 2, height * 0.2);
        ctx.lineTo(width / 2, height * 0.5);
        // 腕（上げた状態）
        ctx.moveTo(width / 2, height * 0.25);
        ctx.lineTo(width / 2 - 30, height * 0.1);
        ctx.moveTo(width / 2, height * 0.25);
        ctx.lineTo(width / 2 + 30, height * 0.1);
        // 脚
        ctx.moveTo(width / 2, height * 0.5);
        ctx.lineTo(width / 2 - 15, height * 0.75);
        ctx.moveTo(width / 2, height * 0.5);
        ctx.lineTo(width / 2 + 15, height * 0.75);
        ctx.stroke();
        break;
    }

    saveCanvasData();
  };

  return (
    <div className="backdrop-blur-lg bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">ポーズエディタ</h2>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 font-medium">
          実験的機能
        </span>
      </div>

      {/* ツールバー */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setCurrentTool('pen')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            currentTool === 'pen'
              ? 'bg-violet-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          ✏️ ペン
        </button>
        <button
          onClick={() => setCurrentTool('eraser')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            currentTool === 'eraser'
              ? 'bg-violet-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          🧹 消しゴム
        </button>
        <button
          onClick={() => setShowGuide(!showGuide)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            showGuide
              ? 'bg-green-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
        >
          📐 ガイド
        </button>
        <button
          onClick={clearCanvas}
          className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-all"
        >
          🗑️ クリア
        </button>
      </div>

      {/* キャンバス */}
      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={300}
          height={400}
          className="w-full border-2 border-slate-200 dark:border-slate-700 rounded-xl cursor-crosshair bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

      {/* プリセット */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wider">
          ポーズプリセット
        </label>
        <div className="grid grid-cols-2 gap-2">
          {posePresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => loadPreset(preset.id)}
              className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">
        💡 ヒント: 線画でポーズを描くと、生成時に反映されます
      </div>
    </div>
  );
}