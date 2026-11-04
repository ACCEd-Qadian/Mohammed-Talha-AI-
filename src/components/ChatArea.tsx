import React, { useRef, useEffect, useState } from 'react';
import {
  User,
  Copy,
  Check,
  RotateCw,
  Volume2,
  VolumeX,
  ExternalLink,
  Edit3,
  ArrowDown,
  Globe,
  FileText,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Message, Theme } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { AIOrb3D } from './AIOrb3D';
import { soundFX } from '../utils/audio';

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  onSendMessage: (text: string) => void;
  onRetry: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  selectedLanguage: string;
  onSelectLanguage: (lang: string) => void;
  theme: Theme;
}

const MINIMAL_SUGGESTIONS = [
  { label: '✨ Ask anything', prompt: 'आप मेरी क्या-क्या सहायता कर सकते हैं और आपको किसने बनाया है?' },
  { label: '💻 React Code', prompt: 'Write a full-stack TypeScript React component with clean Tailwind CSS and state management.' },
  { label: '🔬 Quantum Physics', prompt: 'Explain Quantum Entanglement simply with a step-by-step intuition and real-world analogy.' },
  { label: '🌱 Farming & Crops', prompt: 'भारत में गेहूं की उन्नत फसल के लिए मिट्टी की तैयारी, सिंचाई और कीट प्रबंधन के उपाय बताएं।' },
  { label: '📜 اردو میں نظم', prompt: 'مجھے اردو میں ایک خوبصورت نظم اور اس کا مفہوم بیان کریں۔' },
];

const LANGUAGES = [
  { id: 'Hindi', label: 'हिंदी', flag: '🇮🇳' },
  { id: 'Hinglish', label: 'Hinglish', flag: '🇮🇳' },
  { id: 'English', label: 'English', flag: '🌐' },
  { id: 'Urdu', label: 'اردو', flag: '🇵🇰' },
  { id: 'Punjabi', label: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isStreaming,
  onSendMessage,
  onRetry,
  onEditMessage,
  selectedLanguage,
  onSelectLanguage,
  theme,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const { speak, stop, isPlaying, currentId: speakingId } = useTextToSpeech();
  const isDark = theme === 'dark';

  // Handle auto-scroll
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom(messages.length <= 2 ? 'auto' : 'smooth');
  }, [messages, isStreaming]);

  // Handle scroll detection (Only when there are messages!)
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isFarFromBottom = messages.length > 0 && scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottom(isFarFromBottom);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      soundFX.playClick();
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleToggleSpeak = (messageId: string, content: string) => {
    if (isPlaying && speakingId === messageId) {
      stop();
    } else {
      soundFX.playClick();
      speak(content, messageId);
    }
  };

  const startEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditDraft(msg.content);
  };

  const saveEdit = (messageId: string) => {
    if (editDraft.trim()) {
      onEditMessage(messageId, editDraft.trim());
    }
    setEditingMessageId(null);
  };

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={`relative flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-3 sm:py-6 space-y-4 md:space-y-6 transition-colors duration-200 ${
        isDark
          ? 'bg-[#060914] text-slate-100'
          : 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#ffffff] text-slate-800'
      }`}
    >
      {/* Empty State / 3D Realistic Hero Screen */}
      {messages.length === 0 ? (
        <div className="max-w-2xl mx-auto py-2 sm:py-6 text-center flex flex-col items-center justify-center animate-fadeIn">
          {/* Interactive 3D Holographic AI Core (Touch / Swipe enabled) */}
          <div className="relative mb-2 sm:mb-3 flex items-center justify-center">
            <div
              className={`absolute -inset-4 rounded-full blur-2xl pointer-events-none opacity-40 transition-colors ${
                isDark
                  ? 'bg-gradient-to-tr from-cyan-500/30 via-sky-500/20 to-indigo-500/30'
                  : 'bg-gradient-to-tr from-cyan-400/25 via-blue-400/20 to-indigo-300/25'
              }`}
            />
            <AIOrb3D
              theme={theme}
              state={isStreaming ? 'thinking' : 'idle'}
            />
          </div>

          {/* Title */}
          <h1
            className={`text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-1 sm:mb-2 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            TALHA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600">AI</span>
          </h1>

          {/* Creator Attribution Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium mb-2 shadow-xs ${
              isDark
                ? 'bg-cyan-950/50 border border-cyan-500/30 text-cyan-300'
                : 'bg-white border border-cyan-200 text-cyan-700 shadow-slate-100'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-500" />
            <span>Created by <strong className={isDark ? 'text-white' : 'text-slate-900'}>MOHAMMED TALHA</strong></span>
          </div>

          <p
            className={`text-[11px] sm:text-xs md:text-sm max-w-md mx-auto mb-3 sm:mb-5 leading-relaxed px-2 line-clamp-2 sm:line-clamp-none ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            Your 3D AI Companion for natural multilingual conversation, STEM reasoning, coding, and live web research.
          </p>

          {/* Clean Horizontal Language Ribbon (Single Compact Row on Mobile!) */}
          <div className="w-full max-w-sm sm:max-w-md mb-3 sm:mb-5 flex items-center justify-center">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 scrollbar-none max-w-full">
              {LANGUAGES.map((lang) => {
                const active = selectedLanguage === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => {
                      soundFX.playClick();
                      onSelectLanguage(lang.id);
                    }}
                    className={`flex items-center gap-1 shrink-0 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-all ${
                      active
                        ? isDark
                          ? 'border border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-xs scale-102'
                          : 'border border-cyan-500 bg-cyan-50 text-cyan-700 font-semibold shadow-xs scale-102'
                        : isDark
                        ? 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                        : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900 shadow-2xs'
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimal Inspiration Capsules (Compact & Clean on Mobile) */}
          <div className="w-full max-w-lg flex flex-wrap items-center justify-center gap-1.5 px-2">
            {MINIMAL_SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  soundFX.playClick();
                  onSendMessage(item.prompt);
                }}
                className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[11px] sm:text-xs font-medium transition-all active:scale-97 text-left ${
                  isDark
                    ? 'border border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-cyan-500/40 hover:bg-slate-900/80 hover:text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-cyan-400 hover:bg-cyan-50/50 hover:text-slate-900 shadow-2xs'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-[10px] opacity-40">→</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Conversation Message Feed */
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLastAssistantMessage = !isUser && index === messages.length - 1;

            return (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-3 md:gap-4 animate-fadeIn ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl p-0.5 shadow-md ${
                        isDark
                          ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-cyan-500/20'
                          : 'bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-slate-200'
                      }`}
                    >
                      <img
                        src="/pwa-192x192.png"
                        alt="TALHA AI"
                        className="w-full h-full rounded-[10px] object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div className="max-w-[90%] sm:max-w-[85%] md:max-w-[80%] space-y-2">
                  {/* User Bubble */}
                  {isUser ? (
                    <div className="space-y-1.5">
                      {msg.attachment && (
                        <div
                          className={`flex items-center gap-2 rounded-xl p-2 border max-w-sm ml-auto ${
                            isDark
                              ? 'bg-slate-800/80 border-slate-700'
                              : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          {msg.attachment.previewUrl ? (
                            <img
                              src={msg.attachment.previewUrl}
                              alt={msg.attachment.name}
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover"
                            />
                          ) : (
                            <FileText className="w-7 h-7 text-cyan-500" />
                          )}
                          <div className="truncate text-left">
                            <span
                              className={`text-xs font-medium block truncate ${
                                isDark ? 'text-white' : 'text-slate-800'
                              }`}
                            >
                              {msg.attachment.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {(msg.attachment.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                      )}

                      {editingMessageId === msg.id ? (
                        <div
                          className={`rounded-2xl border p-2.5 sm:p-3 shadow-xl ${
                            isDark
                              ? 'border-cyan-500/60 bg-slate-900'
                              : 'border-cyan-500 bg-white shadow-slate-200'
                          }`}
                        >
                          <textarea
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            className={`w-full rounded-xl p-2 text-xs focus:outline-none ${
                              isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'
                            }`}
                            rows={3}
                          />
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdit(msg.id)}
                              className="rounded-lg bg-cyan-600 px-3 py-1 text-xs font-semibold text-white hover:bg-cyan-500"
                            >
                              Save &amp; Resend
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative rounded-2xl rounded-tr-sm bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white shadow-md">
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <button
                            onClick={() => startEdit(msg)}
                            className="absolute -left-6 top-1.5 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-cyan-500 transition"
                            title="Edit message"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Assistant Bubble */
                    <div
                      className={`rounded-2xl rounded-tl-sm border p-3.5 sm:p-5 shadow-lg transition-colors ${
                        isDark
                          ? 'border-slate-800/80 bg-[#0b1020]/95 backdrop-blur-sm shadow-black/40 text-slate-200'
                          : 'border-slate-200/90 bg-white text-slate-800 shadow-slate-200/50'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 mb-2 pb-1.5 border-b text-xs ${
                          isDark ? 'border-slate-800/60' : 'border-slate-100'
                        }`}
                      >
                        <span
                          className={`font-bold tracking-wide ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          TALHA AI
                        </span>
                        <span className="text-[10px] text-cyan-500 font-mono font-medium">Assistant</span>
                        {msg.isStreaming && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-cyan-500 font-medium ml-auto">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                            Thinking...
                          </span>
                        )}
                      </div>

                      {msg.error ? (
                        <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 dark:bg-rose-950/40 p-2.5 text-xs text-rose-300">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <div className="whitespace-pre-wrap">{msg.error}</div>
                        </div>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <div
                          className={`mt-3 pt-2.5 border-t ${
                            isDark ? 'border-slate-800/70' : 'border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-500 mb-1.5">
                            <Globe className="w-3 h-3" />
                            <span>Web Sources:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {msg.sources.map((source, sIdx) => (
                              <a
                                key={sIdx}
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] transition ${
                                  isDark
                                    ? 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300'
                                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-cyan-400 hover:text-cyan-700'
                                }`}
                                title={source.uri}
                              >
                                <span className="max-w-[130px] truncate">{source.title}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-60" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {!msg.isStreaming && (
                        <div
                          className={`mt-3 pt-2 flex items-center justify-between border-t text-xs ${
                            isDark
                              ? 'border-slate-800/40 text-slate-400'
                              : 'border-slate-100 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className={`flex items-center gap-1 rounded-lg px-2 py-1 transition ${
                                isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-slate-900 hover:bg-slate-100'
                              }`}
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500 text-[11px]">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span className="text-[11px]">Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => handleToggleSpeak(msg.id, msg.content)}
                              className={`flex items-center gap-1 rounded-lg px-2 py-1 transition ${
                                isPlaying && speakingId === msg.id
                                  ? 'text-cyan-500 bg-cyan-100 dark:bg-cyan-950/50 font-medium'
                                  : isDark
                                  ? 'hover:text-white hover:bg-slate-800'
                                  : 'hover:text-slate-900 hover:bg-slate-100'
                              }`}
                              title="Read aloud"
                            >
                              {isPlaying && speakingId === msg.id ? (
                                <>
                                  <VolumeX className="w-3 h-3 text-cyan-500" />
                                  <span className="text-[11px] text-cyan-500">Stop</span>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3" />
                                  <span className="text-[11px]">Listen</span>
                                </>
                              )}
                            </button>
                          </div>

                          {isLastAssistantMessage && (
                            <button
                              onClick={() => {
                                soundFX.playClick();
                                onRetry();
                              }}
                              className={`flex items-center gap-1 rounded-lg px-2 py-1 transition ${
                                isDark ? 'hover:text-cyan-300 hover:bg-slate-800' : 'hover:text-cyan-600 hover:bg-slate-100'
                              }`}
                              title="Regenerate"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span className="text-[11px]">Retry</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl border ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300'
                          : 'bg-slate-200 border-slate-300 text-slate-700'
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Scroll to Bottom Button (Positioned safely above composer, NEVER overlapping send!) */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="fixed bottom-28 right-4 sm:right-6 md:bottom-24 md:right-8 z-20 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-cyan-600 text-white shadow-xl hover:bg-cyan-500 transition active:scale-90"
          title="Scroll to latest message"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
