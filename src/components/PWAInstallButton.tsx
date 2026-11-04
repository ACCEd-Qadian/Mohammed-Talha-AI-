import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3.5 py-2 text-xs md:text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95 ${
          compact ? 'px-2.5 py-1.5 text-xs' : ''
        }`}
        title="Install TALHA AI to your home screen or desktop"
      >
        <Download className="w-4 h-4 text-white" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400/50 transition-all ${
            compact ? 'px-2 py-1 text-[11px]' : ''
          }`}
          title="Install on iOS Safari"
        >
          <Share2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <img src="/pwa-192x192.png" alt="TALHA AI" className="w-7 h-7 rounded-lg" />
                  <h3 className="text-base font-semibold text-white">Install TALHA AI on iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-sm text-slate-300">
                <div className="flex items-start gap-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-white">Step 1: Open Share Menu</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tap the <span className="text-cyan-300 font-semibold">Share</span> icon in your Safari bottom toolbar.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block text-white">Step 2: Add to Home Screen</strong>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Scroll down and tap <span className="text-cyan-300 font-semibold">'Add to Home Screen'</span>.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-2.5 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500 transition active:scale-98"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for desktop Chrome or other browsers if not triggered yet
  return (
    <button
      onClick={() => {
        alert("To install TALHA AI: On desktop Chrome/Edge, click the install icon in the address bar (right side). On mobile, open your browser menu and choose 'Add to Home Screen' or 'Install App'.");
      }}
      className={`hidden md:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:border-cyan-500/40 hover:bg-slate-800 transition ${
        compact ? 'px-2 py-1 text-[11px]' : ''
      }`}
      title="How to install TALHA AI"
    >
      <Download className="w-3.5 h-3.5 text-cyan-400" />
      <span>Install App</span>
    </button>
  );
};
