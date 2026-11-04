import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Sparkles,
  Info,
  Sun,
  Moon,
  Bot,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ChatSession, Theme } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { soundFX } from '../utils/audio';

interface SidebarProps {
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onOpenAbout: () => void;
  onOpenImageStudio: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onOpenAbout,
  onOpenImageStudio,
  theme,
  onToggleTheme,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(soundFX.getMuted());

  const isDark = theme === 'dark';

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (chat: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };

  const saveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const confirmDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    setDeleteConfirmId(id);
  };

  const executeDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundFX.playClick();
    onDeleteChat(id);
    setDeleteConfirmId(null);
  };

  const toggleSound = () => {
    const muted = soundFX.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFX.playClick();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isDark
            ? 'bg-[#070b16] border-slate-800/80 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800 shadow-sm'
        }`}
      >
        {/* Top Header / App Branding */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-slate-800/60' : 'border-slate-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`relative flex items-center justify-center w-9 h-9 rounded-xl p-0.5 shadow-md ${
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
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold tracking-tight text-base ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  TALHA AI
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  3D AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">By MOHAMMED TALHA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`lg:hidden p-1.5 rounded-lg transition ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons: New Chat & Studio */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => {
              soundFX.playClick();
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 p-2.5 text-xs font-semibold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition active:scale-98"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Start New Chat</span>
            </div>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 font-mono">
              Ctrl+N
            </span>
          </button>

          <button
            onClick={() => {
              soundFX.playClick();
              onOpenImageStudio();
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2 rounded-xl p-2.5 text-xs font-medium border transition ${
              isDark
                ? 'border-cyan-500/30 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-400/50'
                : 'border-cyan-200 bg-cyan-50/70 text-cyan-700 hover:bg-cyan-100/70 hover:border-cyan-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span>AI Image Studio</span>
          </button>
        </div>

        {/* Search Conversations */}
        <div className="px-3 pb-2">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs border transition focus:outline-none ${
                isDark
                  ? 'border-slate-800 bg-slate-900/70 text-slate-200 placeholder-slate-500 focus:border-cyan-500'
                  : 'border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-cyan-500'
              }`}
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Conversations ({filteredChats.length})
          </div>

          {filteredChats.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              {searchQuery ? 'No matching chats found' : 'No saved chats yet'}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isEditing = editingId === chat.id;
              const isDeleting = deleteConfirmId === chat.id;

              if (isEditing) {
                return (
                  <div
                    key={chat.id}
                    className={`flex items-center gap-1 rounded-xl p-1.5 border ${
                      isDark
                        ? 'bg-slate-800/90 border-cyan-500/50'
                        : 'bg-white border-cyan-500 shadow-sm'
                    }`}
                  >
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(chat.id, e);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className={`flex-1 bg-transparent px-1.5 py-0.5 text-xs focus:outline-none font-medium ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                      autoFocus
                    />
                    <button
                      onClick={(e) => saveRename(chat.id, e)}
                      className="p-1 text-emerald-500 hover:text-emerald-400"
                      title="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={cancelRename}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              if (isDeleting) {
                return (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between rounded-xl bg-rose-950/40 border border-rose-500/40 p-2 text-xs text-rose-300 animate-fadeIn"
                  >
                    <span className="text-[11px] truncate">Delete this chat?</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => executeDelete(chat.id, e)}
                        className="px-2 py-0.5 rounded bg-rose-600 text-white font-medium hover:bg-rose-500 text-[10px]"
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={chat.id}
                  onClick={() => {
                    soundFX.playClick();
                    onSelectChat(chat.id);
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={`group relative flex items-center justify-between rounded-xl p-2.5 text-xs font-medium cursor-pointer transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/30 shadow-sm'
                        : 'bg-cyan-50 text-cyan-800 border border-cyan-300/80 shadow-xs font-semibold'
                      : isDark
                      ? 'text-slate-300 hover:bg-slate-900/60 hover:text-slate-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive
                          ? 'text-cyan-500'
                          : isDark
                          ? 'text-slate-500 group-hover:text-slate-300'
                          : 'text-slate-400 group-hover:text-slate-700'
                      }`}
                    />
                    <span className="truncate">{chat.title || 'Untitled Chat'}</span>
                  </div>

                  {/* Actions on hover */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => startRename(chat, e)}
                      className={`p-1 rounded transition ${
                        isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'
                      }`}
                      title="Rename"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => confirmDelete(chat.id, e)}
                      className={`p-1 rounded transition ${
                        isDark ? 'hover:bg-slate-700 text-slate-400 hover:text-rose-400' : 'hover:bg-slate-200 text-slate-500 hover:text-rose-600'
                      }`}
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Panel: App Info, Theme, PWA Install */}
        <div
          className={`p-3 border-t space-y-2 ${
            isDark ? 'border-slate-800/60' : 'border-slate-100'
          }`}
        >
          {/* Creator Attribution Card */}
          <div
            onClick={() => {
              soundFX.playClick();
              onOpenAbout();
            }}
            className={`flex items-center justify-between rounded-xl p-2.5 border cursor-pointer transition ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40'
                : 'bg-slate-50 border-slate-200 hover:border-cyan-400 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-500">
                <Bot className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-400 block font-medium">Created by</span>
                <span
                  className={`text-xs font-bold tracking-wide ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  MOHAMMED TALHA
                </span>
              </div>
            </div>
            <Info className="w-4 h-4 text-slate-400 hover:text-cyan-500 transition" />
          </div>

          {/* Install PWA Button */}
          <div className="w-full">
            <PWAInstallButton />
          </div>

          {/* Theme, Sound & About Controls */}
          <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
            <button
              onClick={() => {
                soundFX.playClick();
                onToggleTheme();
              }}
              className={`flex items-center gap-1.5 p-1.5 rounded-lg transition ${
                isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Toggle Light/Dark Theme"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[11px] text-slate-700">Dark Mode</span>
                </>
              )}
            </button>

            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg transition ${
                isDark ? 'hover:text-white hover:bg-slate-800' : 'hover:text-slate-900 hover:bg-slate-100'
              }`}
              title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-cyan-500" />
              )}
            </button>

            <button
              onClick={() => {
                soundFX.playClick();
                onOpenAbout();
              }}
              className={`p-1.5 rounded-lg transition text-[11px] ${
                isDark ? 'hover:text-cyan-300 hover:bg-slate-800' : 'hover:text-cyan-700 hover:bg-slate-100'
              }`}
            >
              About
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
