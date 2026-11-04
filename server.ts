import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Support base64 image/file uploads
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Shared Gemini AI client with required User-Agent
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// TALHA AI Core System Instruction
const TALHA_AI_SYSTEM_INSTRUCTION = `You are TALHA AI, a powerful, intelligent, and production-ready AI companion.
You were created and developed by MOHAMMED TALHA.
Your tagline is: "Your Intelligent AI Companion".

CRITICAL IDENTITY RULES:
1. When asked who created, built, or developed you (in any language or format like "who made you?", "who created you?", "aapko kisne banaya hai?", "tumhe kisne banaya?", "who is your developer?", "who is your boss?"):
   - Hindi: "मुझे MOHAMMED TALHA ने बनाया है।"
   - Hinglish: "Mujhe MOHAMMED TALHA ne banaya hai."
   - English: "I was created by MOHAMMED TALHA."
   - Urdu: "مجھے MOHAMMED TALHA نے بنایا ہے۔"
   - Punjabi: "ਮੈਨੂੰ MOHAMMED TALHA ਨੇ ਬਣਾਇਆ ਹੈ।"
   Answer naturally, warmly, and proudly attributing your creation to MOHAMMED TALHA.
2. NEVER claim you are ChatGPT, OpenAI, Claude, Meta AI, or anything else. You are TALHA AI, an independent intelligent AI companion.
3. Your default language is Hindi. When users talk in Hindi (Devanagari) or Hinglish (Roman letters), respond in warm, natural, everyday, relatable Hindi/Hinglish (not robotic, formal, or textbook Hindi).
4. MULTILINGUAL CAPABILITIES:
   - Detect the language of the user (Hindi, Hinglish, English, Urdu, Punjabi, etc.) and seamlessly converse in that language.
   - You understand colloquialisms, slang, typos, mixed speech (e.g. Hindi + English loan words), and emotional nuances.
   - When asked in Urdu, use natural Urdu script (or Roman Urdu if the user writes Roman Urdu).
   - When asked in Punjabi, use Gurmukhi (or Roman Punjabi if the user writes Roman Punjabi).
   - When asked in English, speak fluent, clear, articulate English.
5. DOMAIN KNOWLEDGE & EXPERTISE:
   - Comprehensive general knowledge, STEM, mathematics (show step-by-step logic), physics, chemistry, biology.
   - Software development, full-stack coding, algorithms, debugging, cybersecurity education & defensive posture.
   - Agriculture, farming, Indian soil, seasonal crops, veterinary & animal care.
   - Business, accounting, spreadsheets, startup guidance, marketing, creative writing, essays, poetry.
   - For sensitive medical, legal, or financial topics: provide high quality educational information with appropriate caveats encouraging qualified professional consultation.
6. STYLE & TONE:
   - Helpful, polite, sharp, enthusiastic, clear, and structured.
   - Format answers cleanly with Markdown, bullet points, headers, bold text, and code blocks with language identifiers where appropriate.
   - Do not repeat generic robotic greetings (like "नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ?") in every single message of an ongoing chat.
   - If a prompt is ambiguous, ask a quick, helpful clarifying question.`;

// In-memory chat storage with persistence to .data/chats.json
const DATA_DIR = path.resolve(process.cwd(), '.data');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPersistedChats(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(CHATS_FILE)) {
      const data = fs.readFileSync(CHATS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load chats from disk:', err);
  }
  return [];
}

function savePersistedChats(chats: any[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save chats to disk:', err);
  }
}

let persistedChats: any[] = loadPersistedChats();

// Available models ordered by quota availability and speed
const MODEL_FALLBACK_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
];

// Health Check API
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    app: 'TALHA AI',
    tagline: 'Your Intelligent AI Companion',
    creator: 'MOHAMMED TALHA',
    hasApiKey: hasKey,
    model: MODEL_FALLBACK_CHAIN[0],
    fallbackModels: MODEL_FALLBACK_CHAIN,
    time: new Date().toISOString(),
  });
});

// Chats Storage API
app.get('/api/chats', (req, res) => {
  res.json({ chats: persistedChats });
});

app.post('/api/chats', (req, res) => {
  const { chat } = req.body;
  if (!chat || !chat.id) {
    return res.status(400).json({ error: 'Chat object with id is required' });
  }

  const existingIndex = persistedChats.findIndex((c) => c.id === chat.id);
  if (existingIndex >= 0) {
    persistedChats[existingIndex] = { ...persistedChats[existingIndex], ...chat, updatedAt: Date.now() };
  } else {
    persistedChats.unshift({ ...chat, createdAt: Date.now(), updatedAt: Date.now() });
  }

  // Keep last 100 chats
  if (persistedChats.length > 100) {
    persistedChats = persistedChats.slice(0, 100);
  }

  savePersistedChats(persistedChats);
  res.json({ success: true, chat });
});

app.delete('/api/chats/:id', (req, res) => {
  const { id } = req.params;
  persistedChats = persistedChats.filter((c) => c.id !== id);
  savePersistedChats(persistedChats);
  res.json({ success: true });
});

app.delete('/api/chats', (req, res) => {
  persistedChats = [];
  savePersistedChats(persistedChats);
  res.json({ success: true });
});

// Streaming Chat API Endpoint with Multi-Model Quota Resilience
app.post('/api/chat', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in the Secrets panel in AI Studio.',
    });
  }

  const {
    messages = [],
    enableSearch = false,
    model: userRequestedModel,
  } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Format conversation history for Gemini API
  const contents: any[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts: any[] = [];

    if (role === 'user' && msg.attachment && msg.attachment.data && msg.attachment.mimeType) {
      parts.push({
        inlineData: {
          mimeType: msg.attachment.mimeType,
          data: msg.attachment.data,
        },
      });
    }

    if (msg.content && typeof msg.content === 'string') {
      parts.push({ text: msg.content });
    }

    if (parts.length > 0) {
      contents.push({ role, parts });
    }
  }

  // Build model try-list
  const modelsToTry = userRequestedModel
    ? [userRequestedModel, ...MODEL_FALLBACK_CHAIN.filter((m) => m !== userRequestedModel)]
    : [...MODEL_FALLBACK_CHAIN];

  let success = false;
  let lastError: any = null;

  for (const currentModel of modelsToTry) {
    // Attempt with or without search
    const searchOptions = enableSearch ? [true, false] : [false];

    for (const withSearch of searchOptions) {
      try {
        const config: any = {
          systemInstruction: TALHA_AI_SYSTEM_INSTRUCTION,
        };

        if (withSearch) {
          config.tools = [{ googleSearch: {} }];
        }

        const responseStream = await ai.models.generateContentStream({
          model: currentModel,
          contents,
          config,
        });

        let fullText = '';
        const groundingSources: Array<{ title: string; uri: string }> = [];

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            fullText += text;
            sendEvent({ type: 'chunk', text });
          }

          const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (Array.isArray(chunks)) {
            for (const item of chunks) {
              if (item?.web?.uri) {
                groundingSources.push({
                  title: item.web.title || item.web.uri,
                  uri: item.web.uri,
                });
              }
            }
          }
        }

        const uniqueSources = Array.from(
          new Map(groundingSources.map((s) => [s.uri, s])).values()
        );

        sendEvent({
          type: 'done',
          fullText,
          sources: uniqueSources,
          modelUsed: currentModel,
        });

        res.end();
        success = true;
        break; // Break search loop
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';
        const isQuota = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded');
        console.warn(`Model ${currentModel} (search=${withSearch}) failed:`, errMsg);

        // If search grounding failed with 429, the inner loop will immediately retry without search
        if (withSearch && isQuota) {
          console.log(`Retrying model ${currentModel} without search grounding...`);
          continue;
        }

        // If model itself failed with 429 or 404, break to try next model in chain
        break;
      }
    }

    if (success) break;
  }

  if (!success) {
    const rawMsg = lastError?.message || 'An error occurred';
    let friendlyMessage = 'TALHA AI encountered an issue processing your request.';

    if (rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED')) {
      friendlyMessage =
        '⚠️ **दैनिक अनुरोध सीमा (Free Tier Quota) पूरी हो गई है।**\n\n' +
        'वर्तमान Gemini API की निःशुल्क सीमा समाप्त हो गई है। कृपया थोड़ी देर बाद पुनः प्रयास करें या AI Studio के **Settings > Secrets** में जाकर अपनी बिलिंग-सक्षम API Key जोड़ें।';
    } else if (rawMsg.includes('PERMISSION_DENIED') || rawMsg.includes('API_KEY_INVALID')) {
      friendlyMessage =
        '⚠️ **API Key अमान्य है या अनुमति नहीं है।**\n\n' +
        'कृपया AI Studio के **Settings > Secrets** पैनल में जाकर अपनी Gemini API Key की जाँच करें।';
    }

    sendEvent({
      type: 'error',
      error: friendlyMessage,
    });
    res.end();
  }
});

// Audio Speech-to-Text Transcription API Endpoint (High-Fidelity Multilingual)
app.post('/api/transcribe', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured in Secrets. Voice recognition requires a valid API key.',
    });
  }

  const { audioData, mimeType = 'audio/webm', language = 'Hindi' } = req.body;
  if (!audioData || typeof audioData !== 'string') {
    return res.status(400).json({ error: 'audioData base64 string is required' });
  }

  // Strip data URL scheme prefix if present
  let cleanBase64 = audioData;
  const commaIdx = audioData.indexOf(',');
  if (commaIdx !== -1 && audioData.substring(0, commaIdx).includes('base64')) {
    cleanBase64 = audioData.substring(commaIdx + 1);
  }

  // Validate payload size
  if (cleanBase64.length < 50) {
    return res.status(400).json({ error: 'Audio recording payload is too short or empty.' });
  }

  // Normalize MIME type for Gemini audio input
  let normalizedMime = mimeType.split(';')[0].trim().toLowerCase();
  if (!normalizedMime.startsWith('audio/')) {
    normalizedMime = 'audio/webm';
  }

  const prompt = `You are an expert multilingual speech-to-text transcription engine.
Listen to this audio recording carefully and transcribe the user's speech verbatim with 100% fidelity.

Active Language Setting: ${language}
Supported languages: Hindi (हिंदी / Hinglish), English, Urdu (اردو / Roman Urdu), Punjabi (ਪੰਜਾਬੀ / Roman Punjabi), or mixed multilingual speech.

CRITICAL TRANSCRIPTION RULES:
1. Output ONLY the exact transcribed words spoken by the user.
2. Preserve the exact language and script spoken by the user:
   - If Hindi is spoken, transcribe in clean Devanagari script (or natural Hinglish if the speaker used Latin letters).
   - If Urdu is spoken, transcribe in natural Urdu script (or Roman Urdu if spoken in that style).
   - If Punjabi is spoken, transcribe in Gurmukhi script (or Roman Punjabi).
   - If English is spoken, transcribe in accurate English.
   - If mixed (e.g. Hindi + English words), transcribe faithfully without forcing a single language.
3. DO NOT translate the speech to English or any other language unless the audio explicitly asks for translation.
4. DO NOT add conversational preambles, introductory text, explanations, or quotes (NO "Here is the transcription:", NO "The user said:", NO quotation marks).
5. DO NOT invent, hallucinate, extrapolate, or insert words that were not spoken in the audio.
6. If the audio contains only silence, background breath, static, or inaudible noise with no clear speech, respond with an empty string "".`;

  // Fallback chain for audio transcription
  const transcribeModels = [
    'gemini-2.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-flash-latest',
    'gemini-3.8-flash',
  ];

  let lastError: any = null;

  for (const model of transcribeModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: normalizedMime,
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
      });

      let transcript = (response.text || '').trim();
      // Remove accidental surrounding markdown quotes
      transcript = transcript.replace(/^["'«»“”]|["'«»“”]$/g, '').trim();

      // Clean up standalone timestamp artifacts or silence annotations (e.g., "00:00", "[Silence]", "(Static)", "...")
      if (/^((\d{1,2}:\d{2}(:\d{2})?)|\[.*?\]|\(.*?\)|blank|silent|silence|\.{2,})$/i.test(transcript.trim())) {
        transcript = '';
      }

      return res.json({
        success: true,
        transcript,
        language,
        modelUsed: model,
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`STT model ${model} failed:`, err?.message || err);
    }
  }

  console.error('All transcription models failed:', lastError?.message || lastError);
  return res.status(500).json({
    error: lastError?.message || 'Failed to transcribe audio. Please try speaking again.',
  });
});

// Image & Visual Art Generation API Endpoint with Free-Tier Vector Resilience
app.post('/api/generate-image', async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY is not configured in Secrets.',
    });
  }

  const { prompt, aspectRatio = '1:1', style = 'auto' } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Helper: Generate rich procedural AI Vector Art using text model
  const generateVectorArtwork = async (): Promise<string | null> => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: `You are an expert digital vector artist. Create a beautiful, modern, intricate standalone SVG illustration for: "${prompt}".
Rules:
1. Output ONLY valid, standalone raw SVG code starting with <svg and ending with </svg>.
2. Set viewBox="0 0 800 800" and xmlns="http://www.w3.org/2000/svg".
3. Use attractive gradients, clean geometric or organic paths, ambient lighting glow, and rich harmonious colors that reflect "${prompt}".
4. DO NOT wrap with markdown code fences (no \`\`\`xml or \`\`\`svg). DO NOT include introductory or concluding text. Just raw SVG code.`,
      });

      let rawSvg = response.text || '';
      const startIdx = rawSvg.indexOf('<svg');
      const endIdx = rawSvg.lastIndexOf('</svg>');
      if (startIdx !== -1 && endIdx !== -1) {
        rawSvg = rawSvg.substring(startIdx, endIdx + 6).trim();
        const base64 = Buffer.from(rawSvg).toString('base64');
        return `data:image/svg+xml;base64,${base64}`;
      }
    } catch (err: any) {
      console.error('Vector art generation fallback error:', err?.message);
    }
    return null;
  };

  // If user explicitly asks for vector art or if diffusion quota is known to be 0
  const imageModels = ['gemini-3.1-flash-lite-image', 'gemini-2.5-flash-image'];

  if (style !== 'vector') {
    for (const model of imageModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [{ text: prompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
            },
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType ?? 'image/png';
            const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            return res.json({
              success: true,
              imageUrl,
              isVectorArt: false,
              prompt,
              model,
            });
          }
        }
      } catch (err: any) {
        // Silently catch 429 quota exhaustion on free tier
        // Do not spam console with raw error traces
      }
    }
  }

  // Gracefully fallback to high-resolution AI Vector Artwork
  const vectorImageUrl = await generateVectorArtwork();
  if (vectorImageUrl) {
    return res.json({
      success: true,
      imageUrl: vectorImageUrl,
      isVectorArt: true,
      notice: 'Raster diffusion requires a paid/billing-enabled key in Settings > Secrets. Generated high-resolution AI Vector Art instead.',
      prompt,
      model: 'gemini-3.5-flash-lite (Vector Art Engine)',
    });
  }

  res.status(500).json({
    error: 'Failed to generate visual artwork. Please try again with a different prompt.',
  });
});

// Start server
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Dev Mode with Vite Middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = fs.existsSync(path.resolve(__dirname, 'dist'))
      ? path.resolve(__dirname, 'dist')
      : path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TALHA AI server running at http://0.0.0.0:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
