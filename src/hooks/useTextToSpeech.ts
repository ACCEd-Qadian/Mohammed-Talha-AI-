import { useState, useEffect, useRef, useCallback } from 'react';

export function useTextToSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (isSupported) {
      synthRef.current = window.speechSynthesis;
    }
  }, [isSupported]);

  // Detect script/language to select best voice
  const detectLanguageCode = (text: string): string => {
    // Check Devanagari range
    if (/[\u0900-\u097F]/.test(text)) {
      return 'hi-IN';
    }
    // Check Urdu / Arabic range
    if (/[\u0600-\u06FF]/.test(text)) {
      return 'ur-PK';
    }
    // Check Gurmukhi / Punjabi range
    if (/[\u0A00-\u0A7F]/.test(text)) {
      return 'pa-IN';
    }
    // Default English
    return 'en-US';
  };

  const speak = useCallback((text: string, messageId: string, preferredLang?: string) => {
    if (!synthRef.current) return;

    // Stop ongoing speech
    synthRef.current.cancel();

    // Strip markdown formatting for cleaner speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*_~>]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) return;

    const lang = preferredLang || detectLanguageCode(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try finding a matching voice
    const voices = synthRef.current.getVoices();
    const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0]));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentId(messageId);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setCurrentId(null);
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsPlaying(false);
      setCurrentId(null);
    };

    synthRef.current.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setCurrentId(null);
    }
  }, []);

  return {
    isSupported,
    isPlaying,
    currentId,
    speak,
    stop,
  };
}
