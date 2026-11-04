import { useVoiceRecorder, UseVoiceRecorderReturn, VoiceRecordingState } from './useVoiceRecorder';

export { useVoiceRecorder };
export type { UseVoiceRecorderReturn, VoiceRecordingState };

/**
 * Modernized useSpeechRecognition hook utilizing high-fidelity MediaRecorder engine
 * with Gemini multimodal multilingual speech recognition, preserving backward compatibility.
 */
export function useSpeechRecognition(options?: { language?: string }) {
  const recorder = useVoiceRecorder({
    language: options?.language || 'Hindi',
  });

  return {
    ...recorder,
    // Backward compatibility mappings
    isListening: recorder.isRecording || recorder.isProcessing,
    transcript: recorder.interimTranscript,
    startListening: (lang?: string) => recorder.startRecording(lang),
    stopListening: () => recorder.stopAndTranscribe(),
    resetTranscript: () => recorder.reset(),
  };
}
