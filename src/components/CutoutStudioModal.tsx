import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Wand2,
  Eraser,
  Paintbrush,
  RotateCcw,
  Undo2,
  Check,
  Download,
  Sparkles,
  Sliders,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  loadImage,
  imageToCanvas,
  cloneCanvas,
  autoRemoveBackground,
  applyStickerBorder,
  magicWandErase,
  brushAction,
  extractDominantPalette,
} from '../utils/cutoutProcessor';
import { sounds } from '../utils/cutoutHelper';

interface CutoutStudioModalProps {
  initialImageUrl: string;
  specimenName: string;
  onClose: () => void;
  onSaveCutout: (stickerDataUrl: string, palette?: string[]) => void;
}

type ToolMode = 'auto' | 'wand' | 'eraser' | 'restore';
type BgPreviewMode = 'checker' | 'dark' | 'white';

export const CutoutStudioModal: React.FC<CutoutStudioModalProps> = ({
  initialImageUrl,
  specimenName,
  onClose,
  onSaveCutout,
}) => {
  // Canvases
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>('auto');
  const [bgPreview, setBgPreview] = useState<BgPreviewMode>('checker');
  const [tolerance, setTolerance] = useState(32);
  const [brushSize, setBrushSize] = useState(24);
  const [strokeWidth, setStrokeWidth] = useState<number>(5); // 0, 3, 5, 8
  const [protectCenter, setProtectCenter] = useState(true);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load and initialize canvases
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsLoading(true);
      try {
        const img = await loadImage(initialImageUrl, specimenName);
        if (!isMounted) return;

        const origCanvas = imageToCanvas(img, 700);
        originalCanvasRef.current = origCanvas;

        // Auto execute initial smart cutout
        const cutoutCanvas = autoRemoveBackground(origCanvas, {
          tolerance: 32,
          feather: 2,
          protectCenter: true,
          strokeWidth: 0,
        });

        currentCanvasRef.current = cutoutCanvas;
        renderToDisplayCanvas();

        // Push initial state to history
        const ctx = cutoutCanvas.getContext('2d');
        if (ctx) {
          const imgData = ctx.getImageData(0, 0, cutoutCanvas.width, cutoutCanvas.height);
          setHistory([imgData]);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load image for cutout:', err);
        setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [initialImageUrl]);

  // Render current working canvas to viewport canvas with optional border
  const renderToDisplayCanvas = useCallback(() => {
    const display = canvasRef.current;
    const current = currentCanvasRef.current;
    if (!display || !current) return;

    display.width = current.width;
    display.height = current.height;
    const ctx = display.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, display.width, display.height);

    if (strokeWidth > 0) {
      const bordered = applyStickerBorder(current, strokeWidth, '#ffffff', true);
      display.width = bordered.width;
      display.height = bordered.height;
      const bCtx = display.getContext('2d');
      if (bCtx) {
        bCtx.drawImage(bordered, 0, 0);
      }
    } else {
      ctx.drawImage(current, 0, 0);
    }
  }, [strokeWidth]);

  useEffect(() => {
    if (!isLoading) {
      renderToDisplayCanvas();
    }
  }, [strokeWidth, isLoading, renderToDisplayCanvas]);

  // Push current state to undo history
  const saveStateToHistory = () => {
    const current = currentCanvasRef.current;
    if (!current) return;
    const ctx = current.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, current.width, current.height);
    setHistory((prev) => [...prev.slice(-10), imgData]);
  };

  // Undo last action
  const handleUndo = () => {
    if (history.length <= 1 || !currentCanvasRef.current) return;
    sounds.playTone(440, 0.04);

    const newHistory = [...history];
    newHistory.pop(); // remove current
    const prevImageData = newHistory[newHistory.length - 1];

    const current = currentCanvasRef.current;
    const ctx = current.getContext('2d');
    if (ctx && prevImageData) {
      ctx.putImageData(prevImageData, 0, 0);
      setHistory(newHistory);
      renderToDisplayCanvas();
    }
  };

  // Run Smart Auto Cutout with current tolerance
  const handleRunAutoCutout = () => {
    if (!originalCanvasRef.current) return;
    setIsProcessing(true);
    sounds.playTone(660, 0.06);

    setTimeout(() => {
      const orig = originalCanvasRef.current;
      if (!orig) return;

      const result = autoRemoveBackground(orig, {
        tolerance,
        feather: 2,
        protectCenter,
        strokeWidth: 0,
      });

      currentCanvasRef.current = result;
      saveStateToHistory();
      renderToDisplayCanvas();
      setIsProcessing(false);
      sounds.playChime();
    }, 50);
  };

  // Reset to original image
  const handleResetToOriginal = () => {
    if (!originalCanvasRef.current) return;
    sounds.playTone(330, 0.05);

    const clone = cloneCanvas(originalCanvasRef.current);
    currentCanvasRef.current = clone;
    saveStateToHistory();
    renderToDisplayCanvas();
  };

  // Helper to map client mouse/touch to canvas coordinates
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    const current = currentCanvasRef.current;
    if (!canvas || !current) return null;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    // Account for stroke border padding offset if active
    const padding = strokeWidth > 0 ? strokeWidth * 2 + 10 : 0;
    const rawX = Math.round(canvasX - padding);
    const rawY = Math.round(canvasY - padding);

    return {
      x: Math.max(0, Math.min(current.width - 1, rawX)),
      y: Math.max(0, Math.min(current.height - 1, rawY)),
    };
  };

  // Canvas Interactions: Magic Wand & Brush
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCanvasCoordinates(e);
    if (!coords || !currentCanvasRef.current || !originalCanvasRef.current) return;

    if (toolMode === 'wand') {
      sounds.playTone(700, 0.04);
      magicWandErase(currentCanvasRef.current, coords.x, coords.y, tolerance);
      saveStateToHistory();
      renderToDisplayCanvas();
    } else if (toolMode === 'eraser' || toolMode === 'restore') {
      setIsDrawing(true);
      brushAction(
        currentCanvasRef.current,
        originalCanvasRef.current,
        coords.x,
        coords.y,
        brushSize,
        toolMode === 'eraser' ? 'erase' : 'restore'
      );
      renderToDisplayCanvas();
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || (toolMode !== 'eraser' && toolMode !== 'restore')) return;
    const coords = getCanvasCoordinates(e);
    if (!coords || !currentCanvasRef.current || !originalCanvasRef.current) return;

    brushAction(
      currentCanvasRef.current,
      originalCanvasRef.current,
      coords.x,
      coords.y,
      brushSize,
      toolMode === 'eraser' ? 'erase' : 'restore'
    );
    renderToDisplayCanvas();
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveStateToHistory();
    }
  };

  // Save Cutout Sticker & Apply to Specimen
  const handleApplySticker = () => {
    const current = currentCanvasRef.current;
    if (!current) return;

    sounds.playSwoosh();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#ffffff', '#18181b', '#10b981', '#f59e0b'],
    });

    // Generate final high-res sticker with border
    const finalCanvas = strokeWidth > 0
      ? applyStickerBorder(current, strokeWidth, '#ffffff', true)
      : current;

    const dataUrl = finalCanvas.toDataURL('image/png');
    const palette = extractDominantPalette(current, 5);

    onSaveCutout(dataUrl, palette);
    onClose();
  };

  // Download Transparent PNG file directly
  const handleDownloadPng = () => {
    const current = currentCanvasRef.current;
    if (!current) return;

    const finalCanvas = strokeWidth > 0
      ? applyStickerBorder(current, strokeWidth, '#ffffff', true)
      : current;

    const link = document.createElement('a');
    link.download = `${specimenName}_sticker.png`;
    link.href = finalCanvas.toDataURL('image/png');
    link.click();
    sounds.playTone(880, 0.05);
  };

  return (
    <div
      id="cutout-studio-modal-backdrop"
      className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 select-none"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#18181B] text-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="p-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-stone-800 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-stone-100 flex items-center gap-1.5">
                표본 스티커 누끼 스튜디오
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold">
                  무료 자체 엔진
                </span>
              </h2>
              <p className="text-[11px] text-stone-400">
                {specimenName} • 배경 자동 제거 및 정밀 터치
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="실행 취소 (Undo)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetToOriginal}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors"
              title="원본으로 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport Canvas Area */}
        <div
          ref={containerRef}
          className={`relative flex-1 min-h-[260px] max-h-[360px] flex items-center justify-center overflow-hidden p-4 ${
            bgPreview === 'checker'
              ? 'bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:12px_12px] bg-[#09090b]'
              : bgPreview === 'white'
              ? 'bg-stone-100'
              : 'bg-stone-950'
          }`}
        >
          {/* Background preview mode switch floating pill */}
          <div className="absolute top-3 left-3 z-10 flex items-center bg-stone-900/90 backdrop-blur-md rounded-xl p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setBgPreview('checker')}
              className={`px-2 py-1 rounded-lg transition-all ${
                bgPreview === 'checker' ? 'bg-stone-700 text-white font-bold' : 'text-stone-400'
              }`}
            >
              투명 격자
            </button>
            <button
              type="button"
              onClick={() => setBgPreview('white')}
              className={`px-2 py-1 rounded-lg transition-all ${
                bgPreview === 'white' ? 'bg-stone-700 text-white font-bold' : 'text-stone-400'
              }`}
            >
              화이트
            </button>
            <button
              type="button"
              onClick={() => setBgPreview('dark')}
              className={`px-2 py-1 rounded-lg transition-all ${
                bgPreview === 'dark' ? 'bg-stone-700 text-white font-bold' : 'text-stone-400'
              }`}
            >
              다크
            </button>
          </div>

          {/* Canvas Display Viewport */}
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-xs text-stone-400">
              <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
              <span>스티커 캔버스 로딩 중...</span>
            </div>
          ) : (
            <div className="relative flex items-center justify-center max-w-full max-h-full">
              <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className={`max-w-full max-h-[300px] object-contain drop-shadow-xl transition-all ${
                  toolMode === 'wand'
                    ? 'cursor-crosshair'
                    : toolMode === 'eraser'
                    ? 'cursor-cell'
                    : toolMode === 'restore'
                    ? 'cursor-pointer'
                    : 'cursor-default'
                }`}
              />
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center gap-2 z-20">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-xs font-bold text-white">배경 분리 연산 중...</span>
            </div>
          )}
        </div>

        {/* Toolbar & Sliders Section */}
        <div className="p-4 bg-stone-900 space-y-3">
          {/* Tool Selector Tabs */}
          <div className="grid grid-cols-4 gap-1.5 bg-stone-950 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setToolMode('auto')}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                toolMode === 'auto'
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>스마트 누끼</span>
            </button>

            <button
              type="button"
              onClick={() => setToolMode('wand')}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                toolMode === 'wand'
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Wand2 className="w-4 h-4 text-amber-400" />
              <span>마법봉 탭</span>
            </button>

            <button
              type="button"
              onClick={() => setToolMode('eraser')}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                toolMode === 'eraser'
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Eraser className="w-4 h-4 text-rose-400" />
              <span>지우개</span>
            </button>

            <button
              type="button"
              onClick={() => setToolMode('restore')}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                toolMode === 'restore'
                  ? 'bg-stone-800 text-white shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Paintbrush className="w-4 h-4 text-sky-400" />
              <span>복원 브러시</span>
            </button>
          </div>

          {/* Contextual Sub-Controls based on selected Tool */}
          {toolMode === 'auto' && (
            <div className="bg-stone-950/70 p-3 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 font-medium">배경 제거 감도 (Tolerance)</span>
                <span className="font-mono text-emerald-400 font-bold">{tolerance}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="75"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-stone-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={protectCenter}
                    onChange={(e) => setProtectCenter(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 bg-stone-800"
                  />
                  <span>중앙 피사체 보호 (꽃/조류 중심부 보존)</span>
                </label>
                <button
                  type="button"
                  onClick={handleRunAutoCutout}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  누끼 다시 적용
                </button>
              </div>
            </div>
          )}

          {toolMode === 'wand' && (
            <div className="bg-stone-950/70 p-3 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 font-medium">마법봉 색상 허용치</span>
                <span className="font-mono text-amber-400 font-bold">{tolerance}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-stone-400">
                💡 지우고 싶은 배경 색상 부분을 화면에서 직접 탭하세요.
              </p>
            </div>
          )}

          {(toolMode === 'eraser' || toolMode === 'restore') && (
            <div className="bg-stone-950/70 p-3 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 font-medium">브러시 크기 (Radius)</span>
                <span className="font-mono text-stone-100 font-bold">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="6"
                max="60"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-stone-300 h-1.5 bg-stone-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-stone-400">
                {toolMode === 'eraser'
                  ? '🖌️ 지우고 싶은 부분을 직접 손가락/마우스로 문지르세요.'
                  : '🌿 너무 많이 지워진 부분을 문지르면 원본 사진이 되살아납니다.'}
              </p>
            </div>
          )}

          {/* Sticker White Border Thickness Selection */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-stone-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-stone-400" />
              스티커 테두리 (Die-cut Stroke)
            </span>
            <div className="flex items-center gap-1 bg-stone-950 p-0.5 rounded-xl text-[11px]">
              {[
                { value: 0, label: '없음' },
                { value: 3, label: '얇게 (3px)' },
                { value: 5, label: '보통 (5px)' },
                { value: 8, label: '굵게 (8px)' },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStrokeWidth(s.value)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    strokeWidth === s.value
                      ? 'bg-stone-800 text-white font-bold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="p-4 pt-3 bg-stone-950 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="py-3 px-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            title="투명 PNG 파일 저장"
          >
            <Download className="w-4 h-4" />
            <span>PNG 저장</span>
          </button>

          <button
            id="btn-apply-cutout-sticker"
            type="button"
            onClick={handleApplySticker}
            className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs rounded-2xl shadow-lg flex items-center justify-center gap-1.5 transition-transform active:scale-98"
          >
            <Check className="w-4 h-4 stroke-[2.5px]" />
            <span>도감 표본 스티커로 확정 등록</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
