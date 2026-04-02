
import { GoogleGenAI, Modality } from "@google/genai";
import { ContractAnalysis, ClassificationResult, ChatMessage, UserPreferences, LLMProvider } from "../types/types";

// Always create a new client to ensure we use the latest injected API key
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const SUPPORTED_MIME_TYPES = [
  "application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic", "image/heif",
  "text/plain", "text/html", "text/css", "text/md", "text/csv", "text/xml", "text/rtf"
];

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, baseDelay = 3000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || "";
      const isRateLimit = errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED");
      
      // If requested entity was not found, we don't retry, we throw so the App can handle it
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
        throw error;
      }

      if (isRateLimit) {
        const delay = baseDelay * Math.pow(2.5, i) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Returns the effective model ID based on prompt guidelines.
 */
const getEffectiveModel = (prefs: UserPreferences) => {
  if (prefs.customModelId) return prefs.customModelId;
  
  // If provider is not Gemini, we route to a Pro model for emulation
  if (prefs.provider !== 'GEMINI') {
    return 'gemini-3-pro-preview';
  }
  
  // Default to Gemini 3 Flash for general tasks if not specified or fallback
  return prefs.preferredModel || 'gemini-3-flash-preview';
};

const SYSTEM_PROMPT = `You are SignWise AI — a signer-first legal document assistant.

Your sole purpose is to protect the user before they sign anything. When given a contract, lease, agreement, NDA, or any legal document, you:

1. Identify red flags — clauses that are predatory, one-sided, or unusually harmful to the signer.
2. Highlight hidden terms — obligations buried in complex language.
3. Flag ambiguous language — anything vague enough to be exploited later.
4. Summarize in plain language — what the user is actually agreeing to.
5. Rate overall risk — LOW / MEDIUM / HIGH with a one-line reason.

Rules you never break:
- You are NOT a lawyer. Always remind the user to consult licensed legal counsel before signing any document.
- Never invent clauses or risks that aren't present in the document.
- Never give a definitive "safe to sign" verdict. You surface risk — the decision belongs to the human.
- If a document is too long to analyze fully, say so clearly and analyze what you can.

Tone: calm, clear, protective. You are an advocate for the signer.`;

/**
 * Returns the system instruction based on the selected provider.
 */
const getSystemInstruction = (prefs: UserPreferences) => {
  if (prefs.provider === 'GEMINI') return SYSTEM_PROMPT;

  const personas: Record<LLMProvider, string> = {
    ANTHROPIC: "You are Claude 3.5. Adopt a helpful, harmless, and honest persona. Use Constitutional AI principles to audit this document. Focus on subtle linguistic traps.",
    MISTRAL: "You are Mistral Large. Adopt a concise, European-norm-aware legal perspective. Focus on logical clarity and data sovereignty.",
    DEEPSEEK: "You are DeepSeek R1. Use massive chain-of-thought reasoning to analyze these documents. Be extremely thorough in spotting edge cases and hidden financial liabilities.",
    OPENAI: "You are GPT-4o. Adopt a highly corporate, precision-focused legal audit style. Be direct and suggest market-standard clauses.",
    GEMINI: ""
  };

  return `${SYSTEM_PROMPT}\n\n[PROVIDER EMULATION MODE: ${prefs.provider}]\n[PERSONA: ${personas[prefs.provider] || ''}]`;
};

export const analyzeBatch = async (
  rawFiles: { base64: string; mimeType: string }[],
  preferences: UserPreferences
): Promise<ContractAnalysis> => {
  return withRetry(async () => {
    const ai = getClient();
    const model = getEffectiveModel(preferences);
    const files = rawFiles.filter(f => SUPPORTED_MIME_TYPES.includes(f.mimeType));
    
    if (files.length === 0) throw new Error("No supported documents found.");

    const parts: any[] = [];
    files.forEach((f, i) => {
      parts.push({ text: `--- Document ${i + 1} ---` });
      parts.push({ inlineData: { data: f.base64, mimeType: f.mimeType } });
    });

    const tools: any[] = [];
    if (preferences.enableSearch) tools.push({ googleSearch: {} });
    if (preferences.enableMaps) tools.push({ googleMaps: {} });

    const prompt = `
      Act as "GuardianPact AI", the world-class signer-first legal bodyguard.
      Analyze the documents for traps, asymmetry, and predatory omissions.
      Return JSON: {
        "summary": "string", "signerScore": 0-100, "worstCaseScenario": "string", "silentOmissions": ["string"],
        "projectAudit": { "overallScore": 0-100, "executiveSummary": "string", "crossDocumentConflicts": [], "projectTimeline": [] },
        "jurisdictionAudit": { "governingLaw": "string", "venue": "string", "favorabilityScore": 0-100, "warning": "string" },
        "dataShield": { "dataOwnership": "string", "aiTrainingRights": false },
        "redFlags": [{"id": "uuid", "issue": "string", "riskLevel": "High", "originalText": "string", "suggestion": {"whyItMatters": "string", "strategy": "string", "counterOffer": "string", "psychologicalInsight": "string", "tacticalTips": []}}],
        "asymmetricClauses": [{"category": "string", "counterpartyRight": "string", "signerRight": "string", "imbalanceLevel": "Severe"}],
        "industryComparison": [{"metric": "string", "assessment": "string", "isStandard": true}]
      }
    `;

    parts.push({ text: prompt });

    const config: any = { 
      responseMimeType: "application/json",
      systemInstruction: getSystemInstruction(preferences)
    };
    if (model.includes('pro')) config.thinkingConfig = { thinkingBudget: 16000 };
    if (tools.length > 0) config.tools = tools;

    const response = await ai.models.generateContent({ model, contents: { parts }, config });
    return JSON.parse(response.text || '{}');
  });
};

export const generateForensicSeal = async (analysisSummary: string, preferences: UserPreferences): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const model = preferences.highQualitySeals ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: `Generate a minimalist, high-tech forensic legal seal. Theme: ${analysisSummary.substring(0, 100)}. Style: Flat vector logo on dark background.` }]
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return "";
  });
};

export const chatWithDocument = async (
  query: string,
  analysis: ContractAnalysis,
  history: ChatMessage[],
  preferences: UserPreferences
): Promise<{ text: string; citations: string[] }> => {
  return withRetry(async () => {
    const ai = getClient();
    const model = getEffectiveModel(preferences);
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: getSystemInstruction(preferences),
        tools: preferences.enableSearch ? [{ googleSearch: {} }] : undefined
      }
    });
    const response = await chat.sendMessage({ message: query });
    const citations: string[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((c: any) => { if (c.web?.uri) citations.push(c.web.uri); });
    }
    return { text: response.text || "", citations };
  });
};

export const classifyUpload = async (base64: string, mime: string, preferences: UserPreferences): Promise<ClassificationResult> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: getEffectiveModel(preferences),
      contents: { parts: [{ inlineData: { data: base64, mimeType: mime } }, { text: "JSON {intent: 'REVIEW'|'CREATE'}" }] },
      config: { 
        responseMimeType: "application/json",
        systemInstruction: getSystemInstruction(preferences)
      }
    });
    return JSON.parse(response.text || '{"intent": "REVIEW"}');
  });
};

export const generateContractContent = async (base64: string, mime: string, preferences: UserPreferences) => {
  return withRetry(async () => {
    const ai = getClient();
    const r = await ai.models.generateContent({
      model: getEffectiveModel(preferences),
      contents: { parts: [{ inlineData: { data: base64, mimeType: mime } }, { text: "Draft signer-first version." }] },
      config: { systemInstruction: getSystemInstruction(preferences) }
    });
    return r.text || "";
  });
};

export const refineContract = async (content: string, instruction: string, preferences: UserPreferences) => {
  return withRetry(async () => {
    const ai = getClient();
    const r = await ai.models.generateContent({
      model: getEffectiveModel(preferences),
      contents: { parts: [{ text: `Instruction: ${instruction}\n\nDraft: ${content}` }] },
      config: { systemInstruction: getSystemInstruction(preferences) }
    });
    return r.text || content;
  });
};

export const generateVoiceSummary = async (text: string): Promise<string> => {
  return withRetry(async () => {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
  });
};

export function decodeBase64(b64: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext) {
  const d = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, d.length, 24000);
  const chan = buffer.getChannelData(0);
  for (let i = 0; i < d.length; i++) chan[i] = d[i] / 32768.0;
  return buffer;
}
