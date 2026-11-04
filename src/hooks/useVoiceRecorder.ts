import { useState, useRef, useCallback, useEffect } from 'react';

export type VoiceRecordingState =
  | 'idle'
  | 'requesting_permission'
  | 'recording'
  | 'stopping'
  | 'transcribing'
  | 'completed'
  | 'error';

export interface UseVoiceRecorderOptions {
  language?: string;
  onTranscriptionComplete?: (transcript: string) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceRecorderReturn {
  state: VoiceRecordingState;
  isRecording: boolean;
  isProcessing: boolean;
  duration: number; // in seconds
  audioLevel: number; // 0 to 100
  interimTranscript: string;
  error: string | null;
  supportedMimeType: string;
  isSupported: boolean;
  startRecording: (preferredLang?: string) => Promise<boolean>;
  stopAndTranscribe: () => Promise<string | null>;
  cancelRecording: () => void;
  reset: () => void;
  clearError: () => void;
}

/**
 * Detect the best supported audio MIME type for MediaRecorder in the current browser.
 */
function getBestSupportedMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'audio/webm';
  }

  const candidateMimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',
  ];

  for (const mime of candidateMimeTypes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }

  return '';
}

/**
 * Convert an Audio Blob to Base64 string without data prefix
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      if (commaIdx !== -1) {
        resolve(result.substring(commaIdx + 1));
      } else {
        resolve(result);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // References to preserve state across asynchronous event loops
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const selectedMimeTypeRef = useRef<string>('');
  const isStoppingRef = useRef(false);
  const currentLanguageRef = useRef<string>(options.language || 'Hindi');
  const speechRecognitionRef = useRef<any>(null);

  // Keep language ref updated
  useEffect(() => {
    if (options.language) {
      currentLanguageRef.current = options.language;
    }
  }, [options.language]);

  const isSupported =
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    Boolean(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    );

  const supportedMimeType = getBestSupportedMimeType();

  // Clean up all audio nodes, tracks, and animation loops safely
  const cleanupAudioPipeline = useCallback(() => {
    // 1. Cancel visualizer animation frame
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);

    // 2. Clear duration timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // 3. Stop parallel interim speech recognition if active
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
      speechRecognitionRef.current = null;
    }

    // 4. Safely stop and release all microphone hardware tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }

    // 5. Close Web Audio API AudioContext
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    mediaRecorderRef.current = null;
    isStoppingRef.current = false;
  }, []);

  // Guarantee cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioPipeline();
    };
  }, [cleanupAudioPipeline]);

  // Start live audio visualizer using Web Audio API
  const startAudioVisualizer = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume in range [0, 100]
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 255) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (e) {
      console.warn('Web Audio visualizer initialization bypassed:', e);
    }
  }, []);

  // Optional: Start parallel Web Speech API strictly for real-time live subtitle preview
  const startInterimSpeechPreview = useCallback((lang: string) => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Language mapping
      let langCode = 'hi-IN';
      if (lang === 'English') langCode = 'en-US';
      if (lang === 'Urdu') langCode = 'ur-PK';
      if (lang === 'Punjabi') langCode = 'pa-IN';
      recognition.lang = langCode;

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        if (current.trim()) {
          setInterimTranscript(current.trim());
        }
      };

      // Mute recognition errors so browser speech engine halts never cancel the real audio recording
      recognition.onerror = () => {
        // Silently ignore interim recognition hiccups
      };

      recognition.onend = () => {
        // Do not abort recording if browser speech recognition stops
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (e) {
      // Browser speech recognition not supported or unavailable in this environment
    }
  }, []);

  // START RECORDING
  const startRecording = useCallback(
    async (preferredLang?: string): Promise<boolean> => {
      if (preferredLang) {
        currentLanguageRef.current = preferredLang;
      }

      cleanupAudioPipeline();
      setError(null);
      setDuration(0);
      setAudioLevel(0);
      setInterimTranscript('');
      chunksRef.current = [];
      isStoppingRef.current = false;

      if (!isSupported) {
        const msg = 'Microphone recording is not supported in this browser. Please use Chrome, Edge, or Firefox.';
        setError(msg);
        setState('error');
        options.onError?.(msg);
        return false;
      }

      setState('requesting_permission');

      let stream: MediaStream;
      try {
        // High quality voice audio constraints (prevent aggressive clipping, preserve consonants)
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: false, // Prevents aggressive clipping of softer vocal parts
            autoGainControl: true,
            channelCount: 1, // Mono delivers pristine speech recognition and halves bandwidth
            sampleRate: 48000,
          },
          video: false,
        });
      } catch (err: any) {
        let msg = 'Failed to access microphone.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Microphone permission was denied. Please allow microphone access in your browser address bar.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No microphone device was found. Please connect a microphone and try again.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          msg = 'Microphone is currently in use by another application. Please close other audio apps.';
        } else if (err.message) {
          msg = `Microphone error: ${err.message}`;
        }

        console.error('getUserMedia error:', err);
        setError(msg);
        setState('error');
        options.onError?.(msg);
        return false;
      }

      mediaStreamRef.current = stream;

      // Start live visualizer
      startAudioVisualizer(stream);

      // Negotiate optimal MIME type
      const mimeType = getBestSupportedMimeType();
      selectedMimeTypeRef.current = mimeType;

      let recorder: MediaRecorder;
      try {
        const recorderOptions: MediaRecorderOptions = {
          audioBitsPerSecond: 128000, // 128 kbps Opus
        };
        if (mimeType) {
          recorderOptions.mimeType = mimeType;
        }
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch (err) {
        console.warn('Fallback: MediaRecorder with default options:', err);
        recorder = new MediaRecorder(stream);
        selectedMimeTypeRef.current = recorder.mimeType || 'audio/webm';
      }

      mediaRecorderRef.current = recorder;

      // Collect audio chunks
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event: any) => {
        console.error('MediaRecorder error event:', event);
        setError('An unexpected error occurred during audio recording.');
        setState('error');
      };

      // Start recording with 250ms timeslice (guarantees continuous chunking & no lost data)
      try {
        recorder.start(250);
      } catch (e: any) {
        console.error('Failed to start MediaRecorder:', e);
        cleanupAudioPipeline();
        setError('Failed to start voice recording. Please try again.');
        setState('error');
        return false;
      }

      // Start duration counter
      timerIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Start parallel interim speech preview if possible
      startInterimSpeechPreview(currentLanguageRef.current);

      setState('recording');
      return true;
    },
    [isSupported, cleanupAudioPipeline, startAudioVisualizer, startInterimSpeechPreview, options]
  );

  // STOP AND TRANSCRIBE (Triggered when user clicks OK)
  const stopAndTranscribe = useCallback(async (): Promise<string | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      return null;
    }

    if (isStoppingRef.current) {
      return null;
    }
    isStoppingRef.current = true;
    setState('stopping');

    // Clear timers & visualizer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);

    // Stop parallel interim speech preview
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    // Wrap recording stop in Promise to wait for the final 'ondataavailable' and 'onstop' events
    const audioBlob = await new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        try {
          const mime = selectedMimeTypeRef.current || recorder.mimeType || 'audio/webm';
          const blob = new Blob(chunksRef.current, { type: mime });
          resolve(blob);
        } catch (e) {
          console.error('Blob creation error:', e);
          resolve(null);
        }
      };

      try {
        // Flush final chunk buffer before stopping
        if (recorder.state === 'recording') {
          recorder.requestData();
        }
        recorder.stop();
      } catch (e) {
        console.error('Error stopping recorder:', e);
        resolve(null);
      }
    });

    // Safely stop all hardware audio tracks immediately
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }

    // Validate audio recording size
    if (!audioBlob || audioBlob.size < 500) {
      const msg = 'No voice audio was captured. Please speak closer to your microphone and try again.';
      setError(msg);
      setState('error');
      options.onError?.(msg);
      cleanupAudioPipeline();
      return null;
    }

    setState('transcribing');

    try {
      // Convert to base64
      const base64Audio = await blobToBase64(audioBlob);

      const mimeType = audioBlob.type || selectedMimeTypeRef.current || 'audio/webm';

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64Audio,
          mimeType,
          language: currentLanguageRef.current,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transcribe voice recording.');
      }

      let transcribedText = (data.transcript || '').trim();

      // If server returned empty, but interim client recognition caught something, use as fallback
      if (!transcribedText && interimTranscript.trim()) {
        transcribedText = interimTranscript.trim();
      }

      if (!transcribedText) {
        const msg = 'Could not detect clear words in the recording. Please speak clearly and try again.';
        setError(msg);
        setState('error');
        options.onError?.(msg);
        cleanupAudioPipeline();
        return null;
      }

      setState('completed');
      options.onTranscriptionComplete?.(transcribedText);
      cleanupAudioPipeline();
      return transcribedText;
    } catch (err: any) {
      console.error('Transcription error:', err);
      // Fallback to interim transcript if available
      if (interimTranscript.trim()) {
        const fallbackText = interimTranscript.trim();
        setState('completed');
        options.onTranscriptionComplete?.(fallbackText);
        cleanupAudioPipeline();
        return fallbackText;
      }

      const msg = err?.message || 'Voice transcription failed. Please check your network or try speaking again.';
      setError(msg);
      setState('error');
      options.onError?.(msg);
      cleanupAudioPipeline();
      return null;
    }
  }, [interimTranscript, options, cleanupAudioPipeline]);

  // CANCEL RECORDING
  const cancelRecording = useCallback(() => {
    cleanupAudioPipeline();
    setState('idle');
    setInterimTranscript('');
    setError(null);
  }, [cleanupAudioPipeline]);

  // RESET
  const reset = useCallback(() => {
    cleanupAudioPipeline();
    setState('idle');
    setDuration(0);
    setAudioLevel(0);
    setInterimTranscript('');
    setError(null);
  }, [cleanupAudioPipeline]);

  const clearError = useCallback(() => {
    setError(null);
    if (state === 'error') {
      setState('idle');
    }
  }, [state]);

  const isRecording = state === 'recording';
  const isProcessing = state === 'requesting_permission' || state === 'stopping' || state === 'transcribing';

  return {
    state,
    isRecording,
    isProcessing,
    duration,
    audioLevel,
    interimTranscript,
    error,
    supportedMimeType,
    isSupported,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
    reset,
    clearError,
  };
}
