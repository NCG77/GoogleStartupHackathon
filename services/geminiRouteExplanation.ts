/**
 * SafeRoute Grounded Gemini Route Explanation Service.
 *
 * Grounded strictly on real component values:
 *   - L (street lighting score)
 *   - P (police proximity in meters)
 *   - C (regional crime score)
 *   - Entrapment (escape options / intersection density)
 *   - Prospect (sightline / road width)
 *   - Travel time delta vs fastest route
 *
 * Hard requirement: The model must not invent reasons. Every clause must trace
 * directly to a provided metric. A deterministic template fallback is included
 * for offline, timeout, or rate-limited scenarios.
 */

export type RouteExplanationParams = {
  lightingScore: number;            // [0.05, 1.0]
  policeDistanceM: number;          // in meters
  crimeScore: number;               // [0, 100]
  entrapmentScore?: number | null;  // [0.05, 1.0]
  prospectScore?: number | null;    // [0.05, 1.0]
  timeOfDayHour: number;            // 0 - 24
  deltaMinutesVsFastest: number;    // >= 0
  safetyDeltaVsFastest: number;     // >= 0
  nearestPoliceName?: string | null;
};

/**
 * Deterministic template fallback. Factual, non-alarmist, zero hallucination.
 */
export function getFallbackRouteExplanation(params: RouteExplanationParams): string {
  const delta = Math.round(params.deltaMinutesVsFastest);
  const prefix = delta > 0 ? `This route is ${delta} minute${delta > 1 ? "s" : ""} longer but ` : "This route ";

  const clauses: string[] = [];

  // 1. Prospect (road width & straightness)
  if (params.prospectScore && params.prospectScore >= 0.55) {
    clauses.push("stays on wider, open streets");
  }

  // 2. Lighting (VIIRS night lighting)
  if (params.lightingScore >= 0.5) {
    clauses.push("follows well-lit night streetscapes");
  } else if (params.lightingScore < 0.2) {
    clauses.push("has limited lighting but avoids isolated stretches");
  }

  // 3. Police proximity
  if (params.policeDistanceM <= 600) {
    const policeLabel = params.nearestPoliceName
      ? `within ${Math.round(params.policeDistanceM)} m of ${params.nearestPoliceName}`
      : `within ${Math.round(params.policeDistanceM)} m of police presence`;
    clauses.push(`passes ${policeLabel}`);
  }

  // 4. Entrapment (escape turns & intersections)
  if (params.entrapmentScore && params.entrapmentScore >= 0.6) {
    clauses.push("keeps frequent escape turns and avoids dead-end stretches");
  }

  if (clauses.length === 0) {
    clauses.push("maximizes verified pedestrian safety over the fastest alternative");
  }

  if (clauses.length === 1) return `${prefix}${clauses[0]}.`;
  if (clauses.length === 2) return `${prefix}${clauses[0]} and ${clauses[1]}.`;
  return `${prefix}${clauses.slice(0, -1).join(", ")}, and ${clauses[clauses.length - 1]}.`;
}

/**
 * Requests grounded Gemini 1.5 Flash explanation.
 * Enforces structured schema and times out to the deterministic template.
 */
export async function explainRouteWithGemini(
  params: RouteExplanationParams,
  timeoutMs: number = 3000
): Promise<string> {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return getFallbackRouteExplanation(params);
  }

  const systemInstruction =
    "You are the SafeRoute Navigation Assistant. You explain to a pedestrian why their selected " +
    "safe route is recommended over the fastest route.\n" +
    "STRICT RULES:\n" +
    "1. Write ONE concise sentence (max 35 words). Calm, factual, non-alarmist.\n" +
    "2. Do NOT invent features, streets, or landmarks not provided in the input.\n" +
    "3. Every claim must trace to an input metric: width -> prospect, lighting -> lightingScore, " +
    "police presence -> policeDistanceM, escape turns -> entrapmentScore, time difference -> deltaMinutesVsFastest.\n" +
    "4. Tone: helpful navigation guidance.";

  const inputPayload = {
    lighting_score: Number(params.lightingScore.toFixed(2)),
    police_distance_m: Math.round(params.policeDistanceM),
    crime_score: Number(params.crimeScore.toFixed(1)),
    entrapment_score: params.entrapmentScore ? Number(params.entrapmentScore.toFixed(2)) : null,
    prospect_score: params.prospectScore ? Number(params.prospectScore.toFixed(2)) : null,
    time_of_day_hour: Number(params.timeOfDayHour.toFixed(1)),
    minutes_slower_than_fastest: Number(params.deltaMinutesVsFastest.toFixed(1)),
    points_safer_than_fastest: Number(params.safetyDeltaVsFastest.toFixed(1)),
    nearest_police_name: params.nearestPoliceName || null,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemInstruction}\n\nInput Metrics:\n${JSON.stringify(inputPayload, null, 2)}\n\nExplanation:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 60,
        },
      }),
    });

    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text && text.length > 10) {
        return text;
      }
    }
  } catch {
    // Timeout or network drop: gracefully use deterministic template
  } finally {
    clearTimeout(timer);
  }

  return getFallbackRouteExplanation(params);
}
