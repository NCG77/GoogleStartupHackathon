/**
 * SafeRoute Hands-Free / Voice-Activated Safety Assistant.
 *
 * Designed for pedestrians walking with earphones at night without drawing attention to a phone:
 *   1. Zero-latency instant distress trigger detection ("help me", "being followed", "call police", "bachao")
 *   2. Gemini (gemini-3.8-flash) audio/speech intent understanding for hands-free navigation:
 *      - "reroute to safer street" / "avoid dark lanes"
 *      - "where is the nearest police" / "find police beat box"
 *      - "how far to destination" / "is this area safe"
 *      - "report broken light here"
 *   3. Reassuring, low-volume, earphone-ready spoken guidance.
 *   4. Deterministic fallback parser for 100% offline reliability.
 */

function getGeminiApiKey(): string | undefined {
  if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) return process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require("expo-constants");
    return (Constants?.default?.expoConfig?.extra || Constants?.expoConfig?.extra)?.geminiApiKey;
  } catch {
    return undefined;
  }
}

export type VoiceIntent =
  | "distress_emergency"
  | "reroute_safest"
  | "find_police"
  | "status_check"
  | "report_hazard"
  | "general_safety_query"
  | "unknown";

export type VoiceAssistantResult = {
  intent: VoiceIntent;
  isEmergency: boolean;
  actionRequired?: "trigger_sos" | "reroute_safest" | "find_police" | "speak_status" | "report_hazard";
  spokenResponse: string; // concise text suitable for earphone text-to-speech
  confidence: number;
  detectedKeywords?: string[];
  modelUsed: string;
};

export type VoiceCommandContext = {
  currentStreetName?: string;
  nearestPoliceName?: string;
  policeDistanceM?: number;
  etaMinutes?: number;
  lightingStatus?: "well-lit" | "dim" | "dark";
};

// Zero-latency regex emergency scanner patterns (English, Hindi, Marathi common distress terms)
const DISTRESS_PATTERNS = [
  /\b(help(\s+me)?|being followed|someone is following|somebody is following|stalking|danger|attack|attacker|save me)\b/i,
  /\b(call (the )?police|call 100|call 112|emergency|sos)\b/i,
  /\b(bachao|madad|choro|police ko bulao|koi peeche hai)\b/i,
];

/**
 * Instant local scanner for life-critical distress phrases (0ms latency).
 *
 * Scans against multi-lingual regex patterns (English, Hindi, Marathi)
 * without making any network requests.
 *
 * @param transcript - Raw speech recognition text from earphone microphone.
 * @returns VoiceAssistantResult with SOS dispatch action if distress detected, else null.
 */
export function checkInstantDistress(transcript: string): VoiceAssistantResult | null {
  if (!transcript || typeof transcript !== "string") return null;
  const normalized = transcript.trim().toLowerCase();
  for (const pattern of DISTRESS_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        intent: "distress_emergency",
        isEmergency: true,
        actionRequired: "trigger_sos",
        spokenResponse:
          "Emergency mode activated. Your live location has been shared with your guardians and nearby police. Stay on the main road.",
        confidence: 0.99,
        detectedKeywords: [normalized],
        modelUsed: "zero-latency-distress-scanner",
      };
    }
  }
  return null;
}

/**
 * Deterministic offline rule-based parser for hands-free navigation commands.
 *
 * @param transcript - Spoken user phrase.
 * @param context - Optional navigation state including ETA, lighting, and police proximity.
 * @returns Parsed VoiceAssistantResult with appropriate navigation action.
 */
export function parseFallbackVoiceCommand(
  transcript: string,
  context?: VoiceCommandContext,
): VoiceAssistantResult {
  if (!transcript || typeof transcript !== "string") {
    return {
      intent: "unknown",
      isEmergency: false,
      spokenResponse: "No voice command heard. SafeRoute is listening.",
      confidence: 0.5,
      modelUsed: "deterministic-voice-parser",
    };
  }
  const norm = transcript.toLowerCase();

  // 1. Distress check first
  const distress = checkInstantDistress(transcript);
  if (distress) return distress;

  // 2. Reroute command
  if (
    norm.includes("safer") ||
    norm.includes("safest") ||
    norm.includes("reroute") ||
    norm.includes("dark") ||
    norm.includes("avoid") ||
    norm.includes("alternate") ||
    norm.includes("another way") ||
    norm.includes("safe route") ||
    norm.includes("well-lit path")
  ) {
    return {
      intent: "reroute_safest",
      isEmergency: false,
      actionRequired: "reroute_safest",
      spokenResponse:
        "Rerouting to the safest well-lit path. Bypassing unlit service lanes.",
      confidence: 0.92,
      modelUsed: "deterministic-voice-parser",
    };
  }

  // 3. Find Police
  if (norm.includes("police") || norm.includes("chowki") || norm.includes("beat box") || norm.includes("station")) {
    const pName = context?.nearestPoliceName || "Police Beat Box";
    const dist = context?.policeDistanceM ? `${Math.round(context.policeDistanceM)} meters` : "300 meters";
    return {
      intent: "find_police",
      isEmergency: false,
      actionRequired: "find_police",
      spokenResponse: `Nearest police presence is ${pName}, ${dist} ahead on the main street.`,
      confidence: 0.95,
      modelUsed: "deterministic-voice-parser",
    };
  }

  // 4. Status / ETA / Safety check
  if (
    norm.includes("status") ||
    norm.includes("how far") ||
    norm.includes("eta") ||
    norm.includes("where am i") ||
    norm.includes("am i safe") ||
    norm.includes("is it safe") ||
    norm.includes("safe here")
  ) {
    const eta = context?.etaMinutes ? `${context.etaMinutes} minutes` : "5 minutes";
    const light = context?.lightingStatus || "well-lit";
    return {
      intent: "status_check",
      isEmergency: false,
      actionRequired: "speak_status",
      spokenResponse: `You are on a ${light} street with active visibility. Estimated ${eta} remaining.`,
      confidence: 0.9,
      modelUsed: "deterministic-voice-parser",
    };
  }

  // 5. Hazard reporting
  if (norm.includes("report") || norm.includes("broken light") || norm.includes("pothole") || norm.includes("water")) {
    return {
      intent: "report_hazard",
      isEmergency: false,
      actionRequired: "report_hazard",
      spokenResponse: "Hazard logged at your current GPS coordinates for community verification.",
      confidence: 0.88,
      modelUsed: "deterministic-voice-parser",
    };
  }

  return {
    intent: "general_safety_query",
    isEmergency: false,
    spokenResponse: "SafeRoute listening. You can say 'Reroute to safer street', 'Where is police', or 'Status'.",
    confidence: 0.75,
    modelUsed: "deterministic-voice-parser",
  };
}

/**
 * Intelligent voice understanding using Gemini (gemini-3.8-flash).
 *
 * Runs 0ms local distress regex scanner first, then requests Gemini semantic intent
 * parsing for hands-free pedestrian guidance.
 *
 * @param transcript - Spoken user audio transcript.
 * @param context - Real-time navigation context (street name, police distance, lighting).
 * @param timeoutMs - Maximum API wait time before executing deterministic fallback (default: 3000ms).
 * @returns Resolves to a structured VoiceAssistantResult with spoken response and action.
 */
export async function processVoiceSafetyCommand(
  transcript: string,
  context?: VoiceCommandContext,
  timeoutMs: number = 3000,
): Promise<VoiceAssistantResult> {
  // Always run 0ms distress scan first
  const instantEmergency = checkInstantDistress(transcript);
  if (instantEmergency) {
    return instantEmergency;
  }

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return parseFallbackVoiceCommand(transcript, context);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const systemInstruction =
    "You are the SafeRoute Hands-Free Voice Assistant for night pedestrians walking with earphones.\n" +
    "Task: Parse user's spoken command and return a reassuring, calm, short earphone response.\n" +
    "Intent Categories:\n" +
    "- 'distress_emergency': User feels threatened, followed, in danger, asks for help/police/sos.\n" +
    "- 'reroute_safest': Wants a safer, more lit, or alternative route.\n" +
    "- 'find_police': Asking for nearest police station or beat box.\n" +
    "- 'status_check': Asking about travel time, safety status, lighting conditions, or progress.\n" +
    "- 'report_hazard': Reporting a hazard verbally (broken light, flooded road, blocked way).\n" +
    "- 'general_safety_query': General pedestrian safety question.\n" +
    "STRICT SPOKEN RESPONSE RULES:\n" +
    "1. Exactly ONE short sentence (max 20 words). Calm, clear, reassuring for earphone playback.\n" +
    "2. If distress/emergency, spoken response MUST immediately reassure that guardians & police are alerted.\n" +
    "Respond in valid JSON only:\n" +
    "{\n" +
    '  "intent": "distress_emergency" | "reroute_safest" | "find_police" | "status_check" | "report_hazard" | "general_safety_query",\n' +
    '  "is_emergency": boolean,\n' +
    '  "action_required": "trigger_sos" | "reroute_safest" | "find_police" | "speak_status" | "report_hazard" | null,\n' +
    '  "spoken_response": string,\n' +
    '  "confidence": number\n' +
    "}";

  const prompt =
    `${systemInstruction}\n\n` +
    `Context:\n` +
    `Current street: ${context?.currentStreetName || "Linking Road"}\n` +
    `Nearest police: ${context?.nearestPoliceName || "Police Beat Box"} (${context?.policeDistanceM ? Math.round(context.policeDistanceM) + "m" : "250m"})\n` +
    `ETA: ${context?.etaMinutes || 5} min\n` +
    `Lighting: ${context?.lightingStatus || "well-lit"}\n\n` +
    `User Spoken Input: "${transcript}"\n\n` +
    `JSON Output:`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          maxOutputTokens: 150,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          intent: (parsed.intent || "general_safety_query") as VoiceIntent,
          isEmergency: Boolean(parsed.is_emergency),
          actionRequired: parsed.action_required || undefined,
          spokenResponse: parsed.spoken_response || "Command acknowledged.",
          confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.9)),
          modelUsed: "gemini-3.8-flash",
        };
      }
    }
  } catch {
    // Fall back smoothly on network or parsing error
  } finally {
    clearTimeout(timer);
  }

  return parseFallbackVoiceCommand(transcript, context);
}

/**
 * Presets for hands-free voice command testing without needing earphone microphone input.
 */
export const VOICE_COMMAND_TEST_PRESETS = [
  {
    id: "cmd_distress",
    label: "🚨 Distress: 'Help me, someone is following me'",
    transcript: "Help me, someone is following me",
    isEmergency: true,
  },
  {
    id: "cmd_reroute",
    label: "🛡️ Reroute: 'Take me on the safest well-lit street'",
    transcript: "Take me on the safest well-lit street and avoid dark lanes",
    isEmergency: false,
  },
  {
    id: "cmd_police",
    label: "👮 Police: 'Where is the nearest police beat box?'",
    transcript: "Where is the nearest police beat box?",
    isEmergency: false,
  },
  {
    id: "cmd_status",
    label: "⏱️ Status: 'How far is my destination and am I safe?'",
    transcript: "How far is my destination and is this area safe?",
    isEmergency: false,
  },
];
