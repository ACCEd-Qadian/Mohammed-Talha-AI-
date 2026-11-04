import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Sparkles, Bot } from 'lucide-react';
import { ChatSession, Message, Attachment, Theme } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { Composer } from './components/Composer';
import { AboutModal } from './components/AboutModal';
import { ImageGenModal } from './components/ImageGenModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { registerSW } from 'virtual:pwa-register';
import { soundFX } from './utils/audio';

const LOCAL_STORAGE_KEY = 'talha_ai_chats_v1';
const THEME_STORAGE_KEY = 'talha_ai_theme';
const LANG_STORAGE_KEY = 'talha_ai_language';

export default function App() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [enableSearch, setEnableSearch] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Hindi');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isDark = theme === 'dark';

  // Initialize PWA Service Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      registerSW({ immediate: true });
    }
  }, []);

  // Initialize theme
  useEffect(() => {
    const savedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedLang = localStorage.getItem(LANG_STORAGE_KEY) || 'Hindi';
    setSelectedLanguage(savedLang);
  }, []);

  // Load chat sessions (from server with localStorage fallback)
  useEffect(() => {
    async function loadChats() {
      try {
        const response = await fetch('/api/chats');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.chats) && data.chats.length > 0) {
            setChats(data.chats);
            setActiveChatId(data.chats[0].id);
            return;
          }
        }
      } catch (e) {
        console.warn('Backend /api/chats unavailable, reading localStorage:', e);
      }

      // Fallback to localStorage
      try {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setChats(parsed);
            setActiveChatId(parsed[0].id);
            return;
          }
        }
      } catch (err) {
        console.error('Error loading localStorage chats:', err);
      }

      // Default initial session
      createNewChat();
    }

    loadChats();
  }, []);

  // Sync chats to localStorage & server
  const persistChatSession = useCallback(async (updatedChat: ChatSession) => {
    try {
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat: updatedChat }),
      });
    } catch (e) {
      // offline or backend hiccup
    }
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chats));
    }
  }, [chats]);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  };

  const createNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);

    const newChat: ChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      language: selectedLanguage,
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    persistChatSession(newChat);
  };

  const handleDeleteChat = async (id: string) => {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      const remaining = chats.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        createNewChat();
      }
    }
    try {
      await fetch(`/api/chats/${id}`, { method: 'DELETE' });
    } catch (e) {
      // ignore
    }
  };

  const handleRenameChat = (id: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, title: newTitle, updatedAt: Date.now() };
          persistChatSession(updated);
          return updated;
        }
        return c;
      })
    );
  };

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0];

  // Send message and execute streaming SSE call
  const handleSendMessage = async (content: string, attachment?: Attachment) => {
    if (!activeChatId) return;

    let targetChat = chats.find((c) => c.id === activeChatId);
    if (!targetChat) {
      createNewChat();
      return;
    }

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
      attachment,
    };

    const assistantMessageId = `msg_asst_${Date.now()}`;
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Auto-generate title if this is the first message
    let newTitle = targetChat.title;
    if (targetChat.messages.length === 0) {
      newTitle = content ? content.slice(0, 32) : (attachment?.name || 'New Chat');
    }

    const updatedMessages = [...targetChat.messages, userMessage, assistantPlaceholder];
    const updatedChat: ChatSession = {
      ...targetChat,
      title: newTitle,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setChats((prev) => prev.map((c) => (c.id === targetChat!.id ? updatedChat : c)));
    setIsStreaming(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const conversationPayload = [
        ...targetChat.messages.map((m) => ({
          role: m.role,
          content: m.content,
          attachment: m.attachment,
        })),
        {
          role: 'user',
          content: userMessage.content,
          attachment: userMessage.attachment,
        },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationPayload,
          enableSearch,
          selectedLanguage,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      let detectedSources: any[] = [];

      if (!reader) {
        throw new Error('Streaming response body is unavailable.');
      }

      let receivedFirstChunk = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawJson = line.substring(6).trim();
            if (!rawJson) continue;

            try {
              const event = JSON.parse(rawJson);

              if (event.type === 'chunk') {
                if (!receivedFirstChunk) {
                  soundFX.playReceive();
                  receivedFirstChunk = true;
                }
                streamedContent += event.text;
                setChats((prev) =>
                  prev.map((c) => {
                    if (c.id === targetChat!.id) {
                      const updated = c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: streamedContent, isStreaming: true }
                          : m
                      );
                      return { ...c, messages: updated };
                    }
                    return c;
                  })
                );
              } else if (event.type === 'done') {
                if (event.sources) {
                  detectedSources = event.sources;
                }
              } else if (event.type === 'error') {
                throw new Error(event.error);
              }
            } catch (jsonErr) {
              // Ignore partial JSON splits
            }
          }
        }
      }

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === targetChat!.id) {
            const finalMsgs = c.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: streamedContent || 'Thinking completed.',
                    isStreaming: false,
                    sources: detectedSources,
                  }
                : m
            );
            const finishedChat = { ...c, messages: finalMsgs, updatedAt: Date.now() };
            persistChatSession(finishedChat);
            return finishedChat;
          }
          return c;
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('User stopped generation');
      } else {
        console.error('Chat error:', err);
        const errMsg = err?.message || 'Failed to communicate with TALHA AI.';
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === targetChat!.id) {
              const errorMsgs = c.messages.map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      isStreaming: false,
                      error: errMsg,
                    }
                  : m
              );
              const failedChat = { ...c, messages: errorMsgs, updatedAt: Date.now() };
              persistChatSession(failedChat);
              return failedChat;
            }
            return c;
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleRetry = () => {
    if (!activeChat || activeChat.messages.length === 0) return;
    const lastUserMessage = [...activeChat.messages].reverse().find((m) => m.role === 'user');
    if (lastUserMessage) {
      const pruned = activeChat.messages.filter(
        (m, idx) => !(idx === activeChat.messages.length - 1 && m.role === 'assistant')
      );
      setChats((prev) =>
        prev.map((c) => (c.id === activeChat.id ? { ...c, messages: pruned } : c))
      );
      handleSendMessage(lastUserMessage.content, lastUserMessage.attachment);
    }
  };

  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!activeChat) return;
    const msgIndex = activeChat.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const pruned = activeChat.messages.slice(0, msgIndex);
    setChats((prev) =>
      prev.map((c) => (c.id === activeChat.id ? { ...c, messages: pruned } : c))
    );
    handleSendMessage(newContent);
  };

  const handleSendImageToChat = (imageUrl: string, prompt: string) => {
    const base64Index = imageUrl.indexOf(';base64,');
    const data = base64Index !== -1 ? imageUrl.substring(base64Index + 8) : imageUrl;
    const mimeType = imageUrl.split(';')[0]?.replace('data:', '') || 'image/png';

    const attachment: Attachment = {
      name: `generated_image_${Date.now()}.png`,
      mimeType,
      size: Math.round((data.length * 3) / 4),
      data,
      previewUrl: imageUrl,
    };

    handleSendMessage(`Here is the generated image for: "${prompt}". What do you think?`, attachment);
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#060914] text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChat?.id || null}
        onSelectChat={(id) => setActiveChatId(id)}
        onNewChat={createNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Viewport */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar (Theme-aware, professional on mobile & desktop) */}
        <header
          className={`flex h-13 sm:h-14 items-center justify-between px-2.5 sm:px-4 backdrop-blur-md z-10 transition-colors border-b ${
            isDark
              ? 'bg-[#080d1c]/90 border-slate-800/70 text-slate-100'
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                soundFX.playClick();
                setIsSidebarOpen(true);
              }}
              className={`p-1.5 rounded-xl transition ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Open Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <div
                className={`relative flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-lg p-0.5 shadow-sm ${
                  isDark
                    ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-cyan-500/30'
                    : 'bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-slate-200'
                }`}
              >
                <img
                  src="/pwa-192x192.png"
                  alt="TALHA AI"
                  className="w-full h-full rounded-[5px] sm:rounded-[6px] object-cover"
                />
              </div>
              <span
                className={`font-bold text-xs sm:text-sm tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                TALHA AI
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Install PWA Button */}
            <PWAInstallButton compact={true} />

            {/* AI Image Studio Button */}
            <button
              onClick={() => {
                soundFX.playClick();
                setIsImageStudioOpen(true);
              }}
              className={`flex items-center gap-1 rounded-xl px-2 sm:px-2.5 py-1 text-xs font-medium border transition ${
                isDark
                  ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/50'
                  : 'border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300'
              }`}
              title="AI Image Studio"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden xs:inline">Studio</span>
            </button>

            {/* Creator info badge */}
            <button
              onClick={() => {
                soundFX.playClick();
                setIsAboutOpen(true);
              }}
              className={`flex items-center gap-1 rounded-xl border px-2 sm:px-2.5 py-1 text-xs transition ${
                isDark
                  ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-cyan-500/40 hover:text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-400 hover:text-slate-900 shadow-xs'
              }`}
              title="About TALHA AI & MOHAMMED TALHA"
            >
              <span className="text-[10px] sm:text-[11px] text-slate-400">By</span>
              <span
                className={`text-[11px] sm:text-xs font-semibold ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                M. TALHA
              </span>
            </button>
          </div>
        </header>

        {/* Chat Message Scroll Area */}
        <ChatArea
          messages={activeChat?.messages || []}
          isStreaming={isStreaming}
          onSendMessage={(text) => handleSendMessage(text)}
          onRetry={handleRetry}
          onEditMessage={handleEditMessage}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={handleLanguageChange}
          theme={theme}
        />

        {/* Input Composer */}
        <Composer
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isStreaming={isStreaming}
          enableSearch={enableSearch}
          onToggleSearch={() => setEnableSearch(!enableSearch)}
          selectedLanguage={selectedLanguage}
          theme={theme}
        />

        {/* Modals & Overlays */}
        <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
        <ImageGenModal
          isOpen={isImageStudioOpen}
          onClose={() => setIsImageStudioOpen(false)}
          onSendToChat={handleSendImageToChat}
        />
        <OfflineIndicator />
      </main>
    </div>
  );
}
