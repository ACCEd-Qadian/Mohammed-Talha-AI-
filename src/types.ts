export interface Attachment {
  name: string;
  mimeType: string;
  size: number;
  data: string; // base64 without data:mime;base64,
  previewUrl: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachment?: Attachment;
  sources?: GroundingSource[];
  isStreaming?: boolean;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  language?: string;
}

export type Theme = 'dark' | 'light';
