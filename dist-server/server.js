// server.ts
import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var TALHA_AI_SYSTEM_INSTRUCTION = `You are TALHA AI, a powerful, intelligent, and production-ready AI companion.
You were created and developed by MOHAMMED TALHA.
Your tagline is: "Your Intelligent AI Companion".

CRITICAL IDENTITY RULES:
1. When asked who created, built, or developed you (in any language or format like "who made you?", "who created you?", "aapko kisne banaya hai?", "tumhe kisne banaya?", "who is your developer?", "who is your boss?"):
   - Hindi: "\u092E\u0941\u091D\u0947 MOHAMMED TALHA \u0928\u0947 \u092C\u0928\u093E\u092F\u093E \u0939\u0948\u0964"
   - Hinglish: "Mujhe MOHAMMED TALHA ne banaya hai."
   - English: "I was created by MOHAMMED TALHA."
   - Urdu: "\u0645\u062C\u06BE\u06D2 MOHAMMED TALHA \u0646\u06D2 \u0628\u0646\u0627\u06CC\u0627 \u06C1\u06D2\u06D4"
   - Punjabi: "\u0A2E\u0A48\u0A28\u0A42\u0A70 MOHAMMED TALHA \u0A28\u0A47 \u0A2C\u0A23\u0A3E\u0A07\u0A06 \u0A39\u0A48\u0964"
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
   - Do not repeat generic robotic greetings (like "\u0928\u092E\u0938\u094D\u0924\u0947! \u092E\u0948\u0902 \u0906\u092A\u0915\u0940 \u0915\u094D\u092F\u093E \u0938\u0939\u093E\u092F\u0924\u093E \u0915\u0930 \u0938\u0915\u0924\u093E \u0939\u0942\u0901?") in every single message of an ongoing chat.
   - If a prompt is ambiguous, ask a quick, helpful clarifying question.`;
var DATA_DIR = path.resolve(__dirname, ".data");
var CHATS_FILE = path.join(DATA_DIR, "chats.json");
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}
function loadPersistedChats() {
  try {
    ensureDataDir();
    if (fs.existsSync(CHATS_FILE)) {
      const data = fs.readFileSync(CHATS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to load chats from disk:", err);
  }
  return [];
}
function savePersistedChats(chats) {
  try {
    ensureDataDir();
    fs.writeFileSync(CHATS_FILE, JSON.stringify(chats, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save chats to disk:", err);
  }
}
var persistedChats = loadPersistedChats();
var MODEL_FALLBACK_CHAIN = [
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-2.5-flash"
];
app.get("/api/health", (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY");
  res.json({
    status: "ok",
    app: "TALHA AI",
    tagline: "Your Intelligent AI Companion",
    creator: "MOHAMMED TALHA",
    hasApiKey: hasKey,
    model: MODEL_FALLBACK_CHAIN[0],
    fallbackModels: MODEL_FALLBACK_CHAIN,
    time: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get("/api/chats", (req, res) => {
  res.json({ chats: persistedChats });
});
app.post("/api/chats", (req, res) => {
  const { chat } = req.body;
  if (!chat || !chat.id) {
    return res.status(400).json({ error: "Chat object with id is required" });
  }
  const existingIndex = persistedChats.findIndex((c) => c.id === chat.id);
  if (existingIndex >= 0) {
    persistedChats[existingIndex] = { ...persistedChats[existingIndex], ...chat, updatedAt: Date.now() };
  } else {
    persistedChats.unshift({ ...chat, createdAt: Date.now(), updatedAt: Date.now() });
  }
  if (persistedChats.length > 100) {
    persistedChats = persistedChats.slice(0, 100);
  }
  savePersistedChats(persistedChats);
  res.json({ success: true, chat });
});
app.delete("/api/chats/:id", (req, res) => {
  const { id } = req.params;
  persistedChats = persistedChats.filter((c) => c.id !== id);
  savePersistedChats(persistedChats);
  res.json({ success: true });
});
app.delete("/api/chats", (req, res) => {
  persistedChats = [];
  savePersistedChats(persistedChats);
  res.json({ success: true });
});
app.post("/api/chat", async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: "GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in the Secrets panel in AI Studio."
    });
  }
  const {
    messages = [],
    enableSearch = false,
    model: userRequestedModel
  } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}

`);
  };
  const contents = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const role = msg.role === "assistant" ? "model" : "user";
    const parts = [];
    if (role === "user" && msg.attachment && msg.attachment.data && msg.attachment.mimeType) {
      parts.push({
        inlineData: {
          mimeType: msg.attachment.mimeType,
          data: msg.attachment.data
        }
      });
    }
    if (msg.content && typeof msg.content === "string") {
      parts.push({ text: msg.content });
    }
    if (parts.length > 0) {
      contents.push({ role, parts });
    }
  }
  const modelsToTry = userRequestedModel ? [userRequestedModel, ...MODEL_FALLBACK_CHAIN.filter((m) => m !== userRequestedModel)] : [...MODEL_FALLBACK_CHAIN];
  let success = false;
  let lastError = null;
  for (const currentModel of modelsToTry) {
    const searchOptions = enableSearch ? [true, false] : [false];
    for (const withSearch of searchOptions) {
      try {
        const config = {
          systemInstruction: TALHA_AI_SYSTEM_INSTRUCTION
        };
        if (withSearch) {
          config.tools = [{ googleSearch: {} }];
        }
        const responseStream = await ai.models.generateContentStream({
          model: currentModel,
          contents,
          config
        });
        let fullText = "";
        const groundingSources = [];
        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            fullText += text;
            sendEvent({ type: "chunk", text });
          }
          const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (Array.isArray(chunks)) {
            for (const item of chunks) {
              if (item?.web?.uri) {
                groundingSources.push({
                  title: item.web.title || item.web.uri,
                  uri: item.web.uri
                });
              }
            }
          }
        }
        const uniqueSources = Array.from(
          new Map(groundingSources.map((s) => [s.uri, s])).values()
        );
        sendEvent({
          type: "done",
          fullText,
          sources: uniqueSources,
          modelUsed: currentModel
        });
        res.end();
        success = true;
        break;
      } catch (err) {
        lastError = err;
        const errMsg = err?.message || "";
        const isQuota = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Quota exceeded");
        console.warn(`Model ${currentModel} (search=${withSearch}) failed:`, errMsg);
        if (withSearch && isQuota) {
          console.log(`Retrying model ${currentModel} without search grounding...`);
          continue;
        }
        break;
      }
    }
    if (success) break;
  }
  if (!success) {
    const rawMsg = lastError?.message || "An error occurred";
    let friendlyMessage = "TALHA AI encountered an issue processing your request.";
    if (rawMsg.includes("429") || rawMsg.includes("RESOURCE_EXHAUSTED")) {
      friendlyMessage = "\u26A0\uFE0F **\u0926\u0948\u0928\u093F\u0915 \u0905\u0928\u0941\u0930\u094B\u0927 \u0938\u0940\u092E\u093E (Free Tier Quota) \u092A\u0942\u0930\u0940 \u0939\u094B \u0917\u0908 \u0939\u0948\u0964**\n\n\u0935\u0930\u094D\u0924\u092E\u093E\u0928 Gemini API \u0915\u0940 \u0928\u093F\u0903\u0936\u0941\u0932\u094D\u0915 \u0938\u0940\u092E\u093E \u0938\u092E\u093E\u092A\u094D\u0924 \u0939\u094B \u0917\u0908 \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0925\u094B\u0921\u093C\u0940 \u0926\u0947\u0930 \u092C\u093E\u0926 \u092A\u0941\u0928\u0903 \u092A\u094D\u0930\u092F\u093E\u0938 \u0915\u0930\u0947\u0902 \u092F\u093E AI Studio \u0915\u0947 **Settings > Secrets** \u092E\u0947\u0902 \u091C\u093E\u0915\u0930 \u0905\u092A\u0928\u0940 \u092C\u093F\u0932\u093F\u0902\u0917-\u0938\u0915\u094D\u0937\u092E API Key \u091C\u094B\u0921\u093C\u0947\u0902\u0964";
    } else if (rawMsg.includes("PERMISSION_DENIED") || rawMsg.includes("API_KEY_INVALID")) {
      friendlyMessage = "\u26A0\uFE0F **API Key \u0905\u092E\u093E\u0928\u094D\u092F \u0939\u0948 \u092F\u093E \u0905\u0928\u0941\u092E\u0924\u093F \u0928\u0939\u0940\u0902 \u0939\u0948\u0964**\n\n\u0915\u0943\u092A\u092F\u093E AI Studio \u0915\u0947 **Settings > Secrets** \u092A\u0948\u0928\u0932 \u092E\u0947\u0902 \u091C\u093E\u0915\u0930 \u0905\u092A\u0928\u0940 Gemini API Key \u0915\u0940 \u091C\u093E\u0901\u091A \u0915\u0930\u0947\u0902\u0964";
    }
    sendEvent({
      type: "error",
      error: friendlyMessage
    });
    res.end();
  }
});
app.post("/api/generate-image", async (req, res) => {
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: "GEMINI_API_KEY is not configured in Secrets."
    });
  }
  const { prompt, aspectRatio = "1:1", style = "auto" } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Prompt is required" });
  }
  const generateVectorArtwork = async () => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: `You are an expert digital vector artist. Create a beautiful, modern, intricate standalone SVG illustration for: "${prompt}".
Rules:
1. Output ONLY valid, standalone raw SVG code starting with <svg and ending with </svg>.
2. Set viewBox="0 0 800 800" and xmlns="http://www.w3.org/2000/svg".
3. Use attractive gradients, clean geometric or organic paths, ambient lighting glow, and rich harmonious colors that reflect "${prompt}".
4. DO NOT wrap with markdown code fences (no \`\`\`xml or \`\`\`svg). DO NOT include introductory or concluding text. Just raw SVG code.`
      });
      let rawSvg = response.text || "";
      const startIdx = rawSvg.indexOf("<svg");
      const endIdx = rawSvg.lastIndexOf("</svg>");
      if (startIdx !== -1 && endIdx !== -1) {
        rawSvg = rawSvg.substring(startIdx, endIdx + 6).trim();
        const base64 = Buffer.from(rawSvg).toString("base64");
        return `data:image/svg+xml;base64,${base64}`;
      }
    } catch (err) {
      console.error("Vector art generation fallback error:", err?.message);
    }
    return null;
  };
  const imageModels = ["gemini-3.1-flash-lite-image", "gemini-2.5-flash-image"];
  if (style !== "vector") {
    for (const model of imageModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [{ text: prompt }]
          },
          config: {
            imageConfig: {
              aspectRatio
            }
          }
        });
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType ?? "image/png";
            const imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            return res.json({
              success: true,
              imageUrl,
              isVectorArt: false,
              prompt,
              model
            });
          }
        }
      } catch (err) {
      }
    }
  }
  const vectorImageUrl = await generateVectorArtwork();
  if (vectorImageUrl) {
    return res.json({
      success: true,
      imageUrl: vectorImageUrl,
      isVectorArt: true,
      notice: "Raster diffusion requires a paid/billing-enabled key in Settings > Secrets. Generated high-resolution AI Vector Art instead.",
      prompt,
      model: "gemini-3.5-flash-lite (Vector Art Engine)"
    });
  }
  res.status(500).json({
    error: "Failed to generate visual artwork. Please try again with a different prompt."
  });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true"
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TALHA AI server running at http://0.0.0.0:${PORT} in ${isProd ? "production" : "development"} mode`);
  });
}
startServer().catch((err) => {
  console.error("Fatal server error:", err);
  process.exit(1);
});
