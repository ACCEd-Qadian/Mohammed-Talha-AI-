import React from 'react';
import { X, Award, Sparkles, Globe, Shield, Cpu, Heart } from 'lucide-react';
import { soundFX } from '../utils/audio';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-cyan-500/30 bg-[#0b1021] text-slate-100 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <img src="/pwa-192x192.png" alt="TALHA AI" className="w-full h-full rounded-[10px] object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                TALHA AI
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  3D AI
                </span>
              </h2>
              <p className="text-xs text-slate-400">Your Intelligent AI Companion</p>
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

        {/* Creator Callout */}
        <div className="my-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 p-4 border border-cyan-500/30 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-cyan-500/10 blur-xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-cyan-400 uppercase">
                Creator &amp; Architect
              </span>
              <h3 className="text-lg font-bold text-white tracking-wide">
                MOHAMMED TALHA
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Conceived, designed, and built by MOHAMMED TALHA as an independent, multilingual, high-performance 3D AI assistant.
              </p>
            </div>
          </div>
        </div>

        {/* Multilingual Creator Identity Answers */}
        <div className="mb-5 space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Natural Creator Attribution
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 font-mono text-[10px] block">Hindi</span>
              <p className="text-slate-200 mt-0.5 font-medium">"मुझे MOHAMMED TALHA ने बनाया है।"</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 font-mono text-[10px] block">Hinglish</span>
              <p className="text-slate-200 mt-0.5 font-medium">"Mujhe MOHAMMED TALHA ne banaya hai."</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 font-mono text-[10px] block">English</span>
              <p className="text-slate-200 mt-0.5 font-medium">"I was created by MOHAMMED TALHA."</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 font-mono text-[10px] block">Urdu</span>
              <p className="text-slate-200 mt-0.5 font-medium" dir="rtl">"مجھے MOHAMMED TALHA نے بنایا ہے۔"</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 sm:col-span-2">
              <span className="text-slate-400 font-mono text-[10px] block">Punjabi</span>
              <p className="text-slate-200 mt-0.5 font-medium">"ਮੈਨੂੰ MOHAMMED TALHA ਨੇ ਬਣਾਇਆ ਹੈ।"</p>
            </div>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Capabilities &amp; Features
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Globe className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Native Multilingual</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Fluent in everyday Hindi, Hinglish, English, Urdu, and Punjabi with automatic language detection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Deep Reasoning &amp; STEM</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Complex problem solving, coding, math, science, and step-by-step logic.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Web Search &amp; Image Studio</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Real-time Google search grounding with citations and AI image synthesis.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-medium">Privacy &amp; Offline PWA</strong>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Installable on phones &amp; desktops with persistent local history and secure proxying.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>by MOHAMMED TALHA</span>
          </div>
          <button
            onClick={() => {
              soundFX.playClick();
              onClose();
            }}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 font-medium text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
