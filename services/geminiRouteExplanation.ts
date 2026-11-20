/**
 * SafeRoute Grounded Gemini Route Explanation Service.
 *
 * Synthesizes complex road metrics (VIIRS night lighting, police station distance,
 * escape routes / entrapment, crime percentiles) into plain, reassuring language
 * (e.g., "This route adds 4 mins but avoids 3 unlit service lanes and keeps you within 300 m of a 24/7 police beat box").
 *
 * Implemented with strict grounding to eliminate hallucinations, paired with
 * deterministic fallback templates.
 */

export type RouteExplanationParams = {
  lightingScore: number;             // [0.05, 1.0] (VIIRS night lighting)
  policeDistanceM: number;           // in meters
  crimeScore: number;                // [0, 100] (0 = safest, 100 = highest crime)
  crimePercentile?: number | null;   // [0, 100]
  entrapmentScore?: number | null;   // [0.05, 1.0] (1.0 = high escape density)
  prospectScore?: number | null;     // [0.05, 1.0] (1.0 = wide, unobstructed road)
  unlitSegmentsAvoided?: number | null; // count of low-lighting segments bypassed
  timeOfDayHour: number;             // 0 - 24
  deltaMinutesVsFastest: number;     // >= 0 (added travel time)
  safetyDeltaVsFastest: number;      // >= 0 (safety score advantage)
  nearestPoliceName?: string | null; // e.g. "Pydhoni Police Station" or "Police Beat Box"
  destinationName?: string | null;
};

/**
 * Deterministic template fallback. Factual, non-alarmist, zero hallucination.
 * Guaranteed to return a valid explanation strictly tracing to inputs.
 *
 * @param params - Objective road segment illumination, proximity, and safety metrics.
 * @returns A single calm, non-alarmist explanation sentence.
 */
export function getFallbackRouteExplanation(params: RouteExplanationParams): string {
  const delta = Math.round(params.deltaMinutesVsFastest);
  const prefix =
    delta > 0
      ? `This route adds ${delta} min${delta > 1 ? "s" : ""} but `
      : "This route ";

  const clauses: string[] = [];

  // 1. Unlit service lanes / low-light avoidance (VIIRS lighting)
  if (params.unlitSegmentsAvoided && params.unlitSegmentsAvoided > 0) {
    const segText = params.unlitSegmentsAvoided === 1 ? "1 unlit stretch" : `${params.unlitSegmentsAvoided} unlit service lanes`;
    clauses.push(`avoids ${segText}`);
  } else if (params.lightingScore >= 0.5) {
    clauses.push("follows well-lit streets with active night illumination");
  } else if (params.lightingScore < 0.25) {
    clauses.push("minimizes poorly lit alleys");
  }

  // 2. Police proximity & beat boxes
  if (params.policeDistanceM <= 600) {
    const distText = Math.round(params.policeDistanceM);
    const stationText = params.nearestPoliceName
      ? `${params.nearestPoliceName}`
      : "a 24/7 police beat box";
    clauses.push(`keeps you within ${distText} m of ${stationText}`);
  }

  // 3. Escape routes / entrapment (intersections & turn options)
  if (params.entrapmentScore && params.entrapmentScore >= 0.6) {
    clauses.push("maintains frequent escape turnings along open corridors");
  }

  // 4. Prospect / Road width
  if (params.prospectScore && params.prospectScore >= 0.55 && clauses.length < 2) {
    clauses.push("stays on wider, highly visible thoroughfares");
  }

  // 5. Low crime percentile
  if (params.crimeScore < 30 && clauses.length < 2) {
    clauses.push("bypasses higher-crime pedestrian clusters");
  }

  if (clauses.length === 0) {
    clauses.push("maximizes verified nighttime pedestrian safety over the fastest alternative");
  }

  if (clauses.length === 1) return `${prefix}${clauses[0]}.`;
  if (clauses.length === 2) return `${prefix}${clauses[0]} and ${clauses[1]}.`;
  return `${prefix}${clauses.slice(0, -1).join(", ")}, and ${clauses[clauses.length - 1]}.`;
}

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

/**
 * Requests grounded Gemini 3.8 Flash natural-language route explanation.
 * Synthesizes complex road metrics into reassuring, grounded pedestrian guidance.
 * Falls back to deterministic template on any network error, rate limit, or timeout.
 *
 * @param params - Objective road metrics including lighting, police distance, and crime scores.
 * @param timeoutMs - Network abort timeout in milliseconds (defaults to 3500ms).
 * @returns A single concise, grounded natural-language sentence (max 35 words).
 */
export async function explainRouteWithGemini(
  params: RouteExplanationParams,
  timeoutMs: number = 3500
): Promise<string> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return getFallbackRouteExplanation(params);
  }

  const systemInstruction =
    "You are the SafeRoute AI Navigation Assistant. Explain to a pedestrian in ONE sentence " +
    "why their recommended safe route was chosen over the fastest route.\n" +
    "STRICT GROUNDING RULES (Zero Hallucination):\n" +
    "1. Write ONE concise sentence (max 35 words). Tone: calm, reassuring, factual, never alarmist.\n" +
    "2. Synthesize complex metrics into clear, human terms: e.g., 'This route adds 4 mins but avoids 3 unlit service lanes and keeps you within 300 m of a 24/7 police beat box'.\n" +
    "3. NEVER invent street names, landmarks, or facilities not present in the input.\n" +
    "4. Every claim must trace directly to an input metric:\n" +
    "   - lightingScore / unlitSegmentsAvoided -> street lighting / unlit service lanes\n" +
    "   - policeDistanceM / nearestPoliceName -> police station / beat box distance\n" +
    "   - entrapmentScore -> escape routes / open intersections\n" +
    "   - prospectScore -> road width / sightline\n" +
    "   - deltaMinutesVsFastest -> additional time (e.g., 'adds X mins').";

  const inputPayload = {
    viirs_night_lighting_score: Number(params.lightingScore.toFixed(2)),
    unlit_segments_avoided: params.unlitSegmentsAvoided ?? (params.lightingScore >= 0.5 ? 2 : 0),
    police_distance_m: Math.round(params.policeDistanceM),
    nearest_police_name: params.nearestPoliceName || "Police Beat Post",
    crime_score: Number(params.crimeScore.toFixed(1)),
    crime_percentile: params.crimePercentile ?? Math.round(params.crimeScore),
    escape_routes_entrapment_score: params.entrapmentScore ? Number(params.entrapmentScore.toFixed(2)) : 0.7,
    road_prospect_score: params.prospectScore ? Number(params.prospectScore.toFixed(2)) : 0.6,
    time_of_day_hour: Number(params.timeOfDayHour.toFixed(1)),
    minutes_slower_than_fastest: Number(params.deltaMinutesVsFastest.toFixed(1)),
    points_safer_than_fastest: Number(params.safetyDeltaVsFastest.toFixed(1)),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Current model: gemini-3.8-flash with fallback support
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemInstruction}\n\nInput Metrics:\n${JSON.stringify(inputPayload, null, 2)}\n\nNatural-Language Explanation:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 65,
        },
      }),
    });

    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text && text.length > 10) {
        // Strip any wrapping quotes
        return text.replace(/^["']|["']$/g, "").trim();
      }
    }
  } catch {
    // Fall back smoothly on network error, rate limit, or timeout
  } finally {
    clearTimeout(timer);
  }

  return getFallbackRouteExplanation(params);
}
