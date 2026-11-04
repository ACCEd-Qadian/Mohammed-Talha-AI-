import React, { useState } from 'react';
import { X, Sparkles, Download, MessageSquare, Loader2, Info, Layers, Check } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface ImageGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (imageUrl: string, prompt: string) => void;
}

const SAMPLE_PROMPTS = [
  'Futuristic cybernetic tiger with glowing neon cyan stripes on dark metallic surface',
  'Cozy ancient library filled with glowing magical manuscripts and floating lanterns',
  'Vibrant traditional Indian street food market at dusk with colorful stalls',
  'Minimalist geometric architectural pavilion hovering over a calm turquoise lake',
];

export const ImageGenModal: React.FC<ImageGenModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [styleMode, setStyleMode] = useState<'vector' | 'diffusion'>('vector');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    soundFX.playClick();
    setIsGenerating(true);
    setError(null);
    setNotice(null);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          style: styleMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate visual artwork.');
      }

      if (data.imageUrl) {
        soundFX.playReceive();
        setGeneratedImage(data.imageUrl);
        if (data.notice) {
          setNotice(data.notice);
        }
      } else {
        throw new Error(data.error || 'No visual artwork was returned.');
      }
    } catch (err: any) {
      console.error('Image gen failed:', err);
      setError(err?.message || 'Something went wrong while generating the artwork.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    soundFX.playClick();
    const isSvg = generatedImage.startsWith('data:image/svg+xml');
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `talha-ai-${Date.now()}.${isSvg ? 'svg' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-cyan-500/30 bg-[#0a0e1c] p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                TALHA AI Image Studio
              </h2>
              <p className="text-xs text-slate-400">Generate creative visual art &amp; vector illustrations</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input and Controls */}
        <div className="mt-4 space-y-4">
          {/* Generation Engine Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Generation Engine
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStyleMode('vector')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition ${
                  styleMode === 'vector'
                    ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>AI Vector Art (Instant Free)</span>
              </button>

              <button
                type="button"
                onClick={() => setStyleMode('diffusion')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-medium transition ${
                  styleMode === 'diffusion'
                    ? 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Photorealistic Diffusion</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description / Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the artwork you want to create (e.g. Glowing cybernetic owl with crystal feathers, intricate circuit board patterns)..."
              rows={3}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition resize-none"
            />
          </div>

          {/* Quick Inspirations */}
          <div>
            <span className="text-[11px] font-medium text-slate-400 block mb-1.5">Try an inspiration:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(p)}
                  className="rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition text-left"
                >
                  {p.slice(0, 48)}...
                </button>
              ))}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-99"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Creating Visual Artwork...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>Generate Artwork</span>
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Friendly notice if diffusion gracefully routed to vector art */}
          {notice && (
            <div className="flex items-start gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/40 p-2.5 text-xs text-cyan-300">
              <Info className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              <span>{notice}</span>
            </div>
          )}

          {/* Generated Result */}
          {generatedImage && (
            <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-4">
              <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-black min-h-[260px] max-h-[380px] flex items-center justify-center p-2">
                <img
                  src={generatedImage}
                  alt={prompt}
                  className="w-full h-auto max-h-[360px] object-contain rounded-lg"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400 line-clamp-1 italic">
                  "{prompt}"
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  {onSendToChat && (
                    <button
                      onClick={() => {
                        soundFX.playClick();
                        onSendToChat(generatedImage, prompt);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Use in Chat</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
