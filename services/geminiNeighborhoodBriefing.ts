/**
 * SafeRoute Dynamic Neighborhood Safety Briefing Service.
 *
 * Generates dynamic, time-aware pre-trip briefings powered by Gemini 3.8 Flash:
 * e.g., "You're traveling after 10 PM in Kurla. Linking Road remains well-lit and active
 * until midnight, but pedestrian crossways near the station have reduced lighting."
 *
 * Grounded strictly in real road metrics:
 *   - Area name & time of day (hour)
 *   - VIIRS night lighting score
 *   - Police station proximity & beat boxes
 *   - Community reports / active hazards
 *   - Pedestrian crowd activity
 *
 * Paired with a deterministic time-aware template fallback for 100% offline reliability.
 */

import Constants from "expo-constants";

export type NeighborhoodBriefingParams = {
  areaName: string;
  hour?: number; // 0 - 24
  lightingScore?: number; // [0.0, 1.0]
  crimeScore?: number; // [0, 100]
  nearbyHazardsCount?: number;
  policeDistanceM?: number;
  nearestPoliceName?: string;
  crowdRatio?: number; // [0.0, 1.0]
  timeoutMs?: number;
};

export type NeighborhoodSafetyBriefing = {
  headline: string;
  briefing: string;
  timeContext: string;
  riskLevel: "low" | "moderate" | "caution";
  highlights: string[];
  audioBriefingText: string;
  modelUsed: string;
};

function getTimeLabel(hour: number): string {
  if (hour >= 23 || hour < 4) return "Late Night (Post-11 PM)";
  if (hour >= 21) return "Night Travel (After 9 PM)";
  if (hour >= 18) return "Evening Commute";
  if (hour >= 12) return "Afternoon";
  return "Morning Walk";
}

/**
 * Deterministic time-aware fallback when offline or rate limited.
 * Evaluates hour of day and baseline lighting metrics to generate pre-trip advice.
 *
 * @param params - Neighborhood parameters including area name, current hour, and lighting score.
 * @returns Deterministic NeighborhoodSafetyBriefing with temporal context and highlights.
 */
export function getFallbackNeighborhoodBriefing(
  params: NeighborhoodBriefingParams,
): NeighborhoodSafetyBriefing {
  const hour = params.hour != null ? params.hour : new Date().getHours();
  const area = params.areaName || "Your area";
  const timeContext = getTimeLabel(hour);
  const isNight = hour >= 21 || hour < 5;
  const light = params.lightingScore ?? 0.65;
  const policeDist = Math.round(params.policeDistanceM ?? 350);
  const pName = params.nearestPoliceName || "Police Beat Box";

  let riskLevel: "low" | "moderate" | "caution" = "low";
  let headline = `Current safety briefing for ${area}`;
  let briefing = "";
  const highlights: string[] = [];

  if (isNight) {
    if (light >= 0.6) {
      riskLevel = "low";
      headline = `Well-lit corridors active in ${area}`;
      briefing = `You're traveling after 9 PM in ${area}. Main commercial avenues remain well-illuminated and active, while pedestrian crossways and narrow service lanes have reduced lighting. A ${pName} is located ${policeDist} m away.`;
      highlights.push("Main arterial roads well-lit");
      highlights.push(`${pName} within ${policeDist} m`);
      highlights.push("Moderate commercial foot traffic");
    } else {
      riskLevel = "caution";
      headline = `Reduced night visibility in ${area}`;
      briefing = `You're traveling after 10 PM in ${area}. Several secondary lanes have limited night illumination. Stick to major bus and transit corridors where commercial lighting and police patrols remain active.`;
      highlights.push("Stay on transit roads");
      highlights.push("Avoid unlit service shortcuts");
      highlights.push(`${pName} within ${policeDist} m`);
    }
  } else {
    riskLevel = "low";
    headline = `Active daytime pedestrian flow in ${area}`;
    briefing = `Daytime pedestrian conditions in ${area} are normal with open storefronts, steady foot traffic, and clear sightlines throughout the primary routes.`;
    highlights.push("High pedestrian density");
    highlights.push("Clear sightlines");
    highlights.push("Active civic facilities");
  }

  return {
    headline,
    briefing,
    timeContext,
    riskLevel,
    highlights,
    audioBriefingText: briefing,
    modelUsed: "deterministic-time-template",
  };
}

/**
 * Generates a dynamic, time-aware pre-trip neighborhood safety briefing via Gemini 3.8 Flash.
 *
 * Synthesizes current hour, satellite night lighting, police proximity, and crowd flow
 * into a grounded, reassuring pre-trip briefing with actionable highlights.
 *
 * @param params - Geographic area name, hour of day, illumination, and police proximity metrics.
 * @returns Resolves to a structured NeighborhoodSafetyBriefing.
 */
export async function generateNeighborhoodSafetyBriefing(
  params: NeighborhoodBriefingParams,
): Promise<NeighborhoodSafetyBriefing> {
  const apiKey =
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    (Constants.expoConfig?.extra as { geminiApiKey?: string } | undefined)?.geminiApiKey;

  if (!apiKey) {
    return getFallbackNeighborhoodBriefing(params);
  }

  const hour = params.hour != null ? params.hour : new Date().getHours();
  const timeoutMs = params.timeoutMs ?? 5000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const systemInstruction =
    "You are the SafeRoute Neighborhood Pre-Trip Safety Intelligence Engine.\n" +
    "Task: Generate a dynamic, time-aware pedestrian safety briefing for a specific neighborhood.\n" +
    "Style example: 'You're traveling after 10 PM in Kurla. Linking Road remains well-lit and active until midnight, but pedestrian crossways near the station have reduced lighting.'\n" +
    "GROUNDING RULES (Zero Hallucination):\n" +
    "1. Directly cite the neighborhood name and time context (e.g., 'after 10 PM in Kurla').\n" +
    "2. Ground claims strictly on the input metrics (lighting score, police proximity, hazards).\n" +
    "3. Highlight which streets/corridors stay well-lit vs which crossways/alleys to avoid.\n" +
    "4. Tone: calm, reassuring, highly practical, never sensationalist or fearful.\n" +
    "5. Briefing text MUST be 25 to 45 words maximum.\n" +
    "Respond strictly in valid JSON matching this schema:\n" +
    "{\n" +
    '  "headline": string,\n' +
    '  "briefing": string,\n' +
    '  "risk_level": "low" | "moderate" | "caution",\n' +
    '  "highlights": string[],\n' +
    '  "audio_briefing_text": string\n' +
    "}";

  const payload = {
    area_name: params.areaName || "Kurla",
    hour_of_day: hour,
    lighting_score: params.lightingScore ?? 0.65,
    crime_score: params.crimeScore ?? 35,
    police_distance_m: params.policeDistanceM ?? 300,
    nearest_police_name: params.nearestPoliceName || "Police Beat Box",
    nearby_hazards_count: params.nearbyHazardsCount ?? 0,
    crowd_activity: (params.crowdRatio ?? 0.6) >= 0.5 ? "active" : "quiet",
  };

  try {
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
                text: `${systemInstruction}\n\nMetrics:\n${JSON.stringify(payload, null, 2)}\n\nJSON Output:`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          maxOutputTokens: 250,
        },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          headline: parsed.headline || `Safety Briefing for ${params.areaName}`,
          briefing: parsed.briefing,
          timeContext: getTimeLabel(hour),
          riskLevel: parsed.risk_level || "low",
          highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 3) : [],
          audioBriefingText: parsed.audio_briefing_text || parsed.briefing,
          modelUsed: "gemini-3.8-flash",
        };
      }
    }
  } catch {
    // Fall back smoothly on network or parsing error
  } finally {
    clearTimeout(timer);
  }

  return getFallbackNeighborhoodBriefing(params);
}
