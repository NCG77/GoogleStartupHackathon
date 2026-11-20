/**
 * Unit and integration verification suite for Gemini 3.8 Flash Safety Features:
 *   1. Natural-Language Route Explanations ("Why This Route?")
 *   2. Multimodal Incident & Hazard Verification
 *   3. Hands-Free / Voice-Activated Safety Assistant
 *   4. Neighborhood Safety Briefings
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  explainRouteWithGemini,
  getFallbackRouteExplanation,
} from "../services/geminiRouteExplanation.ts";

import {
  getFallbackHazardVerification,
  verifyHazardPhotoWithGemini,
  SAMPLE_HAZARD_PRESETS,
} from "../services/geminiHazardVerification.ts";

import {
  checkInstantDistress,
  parseFallbackVoiceCommand,
  processVoiceSafetyCommand,
  VOICE_COMMAND_TEST_PRESETS,
} from "../services/geminiVoiceSafetyAssistant.ts";

import {
  generateNeighborhoodSafetyBriefing,
  getFallbackNeighborhoodBriefing,
} from "../services/geminiNeighborhoodBriefing.ts";

test("Feature 1: Route Explanations - Deterministic Fallback & Metric Grounding", () => {
  const explanation = getFallbackRouteExplanation({
    lightingScore: 0.72,
    policeDistanceM: 300,
    crimeScore: 20,
    unlitSegmentsAvoided: 3,
    timeOfDayHour: 22.0,
    deltaMinutesVsFastest: 4,
    safetyDeltaVsFastest: 18,
    nearestPoliceName: "Kurla Police Beat Box",
  });

  assert.match(explanation, /This route adds 4 mins but/);
  assert.match(explanation, /avoids 3 unlit service lanes/);
  assert.match(explanation, /keeps you within 300 m of Kurla Police Beat Box/);
  assert.ok(explanation.endsWith("."));

  // Check 0 added minutes format
  const noDelta = getFallbackRouteExplanation({
    lightingScore: 0.8,
    policeDistanceM: 200,
    crimeScore: 10,
    timeOfDayHour: 20.0,
    deltaMinutesVsFastest: 0,
    safetyDeltaVsFastest: 10,
  });
  assert.ok(noDelta.startsWith("This route "));
  assert.ok(!noDelta.includes("adds"));
});

test("Feature 1: Route Explanations - Offline Graceful Degradation", async () => {
  const result = await explainRouteWithGemini({
    lightingScore: 0.65,
    policeDistanceM: 400,
    crimeScore: 25,
    unlitSegmentsAvoided: 2,
    timeOfDayHour: 21.5,
    deltaMinutesVsFastest: 3,
    safetyDeltaVsFastest: 15,
  });

  assert.ok(typeof result === "string");
  assert.ok(result.length > 15);
  assert.match(result, /adds 3 mins/);
  assert.match(result, /avoids 2 unlit service lanes/);
});

test("Feature 2: Multimodal Hazard Verification - Spam & Irrelevant Filtering", () => {
  const spamResult = getFallbackHazardVerification({
    userCategory: "General",
    userDescription: "Just posting a funny selfie here lol",
  });

  assert.strictEqual(spamResult.isAuthenticHazard, false);
  assert.strictEqual(spamResult.classifiedCategory, "spam_or_irrelevant");
  assert.strictEqual(spamResult.moderationAction, "rejected_spam");
  assert.ok(spamResult.confidence >= 0.85);
});

test("Feature 2: Multimodal Hazard Verification - Authentic Hazard Classification", () => {
  const brokenLight = getFallbackHazardVerification({
    userCategory: "Lighting",
    userDescription: "Streetlight is broken and alley is completely dark",
  });

  assert.strictEqual(brokenLight.isAuthenticHazard, true);
  assert.strictEqual(brokenLight.classifiedCategory, "broken_streetlights");
  assert.strictEqual(brokenLight.moderationAction, "auto_approved");

  const waterlogged = getFallbackHazardVerification({
    userCategory: "Road Condition",
    userDescription: "Severe waterlogging on sidewalk, pedestrians forced into road",
  });
  assert.strictEqual(waterlogged.isAuthenticHazard, true);
  assert.strictEqual(waterlogged.classifiedCategory, "waterlogging");

  const deserted = getFallbackHazardVerification({
    userCategory: "Safety",
    userDescription: "Deserted alley with low visibility",
  });
  assert.strictEqual(deserted.isAuthenticHazard, true);
  assert.strictEqual(deserted.classifiedCategory, "deserted_alley");
});

test("Feature 2: Multimodal Hazard Verification - Sample Presets Verification", async () => {
  for (const preset of SAMPLE_HAZARD_PRESETS) {
    const res = await verifyHazardPhotoWithGemini({
      base64Image: preset.base64,
      userCategory: preset.category,
      userDescription: preset.description,
    });
    assert.ok(res);
    assert.ok(typeof res.displayLabel === "string");
    if (preset.id === "sample_spam") {
      assert.strictEqual(res.moderationAction, "rejected_spam");
    } else {
      assert.strictEqual(res.isAuthenticHazard, true);
    }
  }
});

test("Feature 3: Voice Safety Assistant - Instant 0ms Distress Scanner", () => {
  // English distress phrases
  const sosEn1 = checkInstantDistress("Help me! Someone is following me!");
  assert.ok(sosEn1);
  assert.strictEqual(sosEn1.isEmergency, true);
  assert.strictEqual(sosEn1.actionRequired, "trigger_sos");
  assert.match(sosEn1.spokenResponse, /Emergency mode activated/);

  const sosEn2 = checkInstantDistress("Call police emergency please");
  assert.ok(sosEn2);
  assert.strictEqual(sosEn2.isEmergency, true);

  // Hindi / Marathi distress phrases
  const sosHi1 = checkInstantDistress("Bachao koi peeche hai!");
  assert.ok(sosHi1);
  assert.strictEqual(sosHi1.isEmergency, true);
  assert.strictEqual(sosHi1.actionRequired, "trigger_sos");

  const sosHi2 = checkInstantDistress("Madad karo choro");
  assert.ok(sosHi2);
  assert.strictEqual(sosHi2.isEmergency, true);

  // Normal command should NOT trigger emergency
  const normal = checkInstantDistress("How far to Kurla station?");
  assert.strictEqual(normal, null);
});

test("Feature 3: Voice Safety Assistant - Navigation Intent Parsing", () => {
  const reroute = parseFallbackVoiceCommand("Take me on the safest well-lit path");
  assert.strictEqual(reroute.intent, "reroute_safest");
  assert.strictEqual(reroute.actionRequired, "reroute_safest");

  const police = parseFallbackVoiceCommand("Where is the nearest police beat box?", {
    nearestPoliceName: "Kurla Police Beat Box",
    policeDistanceM: 280,
  });
  assert.strictEqual(police.intent, "find_police");
  assert.strictEqual(police.actionRequired, "find_police");
  assert.match(police.spokenResponse, /Kurla Police Beat Box/);
  assert.match(police.spokenResponse, /280 meters/);

  const status = parseFallbackVoiceCommand("How far to destination and am I safe?", {
    etaMinutes: 4,
    lightingStatus: "well-lit",
  });
  assert.strictEqual(status.intent, "status_check");
  assert.strictEqual(status.actionRequired, "speak_status");
  assert.match(status.spokenResponse, /4 minutes/);
});

test("Feature 3: Voice Safety Assistant - Preset Commands Verification", async () => {
  for (const preset of VOICE_COMMAND_TEST_PRESETS) {
    const res = await processVoiceSafetyCommand(preset.transcript, {
      nearestPoliceName: "Santacruz Police Station",
      policeDistanceM: 250,
      etaMinutes: 5,
      lightingStatus: "well-lit",
    });
    assert.ok(res);
    assert.ok(res.spokenResponse.length > 5);
    if (preset.isEmergency) {
      assert.strictEqual(res.isEmergency, true);
      assert.strictEqual(res.actionRequired, "trigger_sos");
    }
  }
});

test("Feature 4: Dynamic Neighborhood Safety Briefing - Time & Context Awareness", () => {
  // Late Night (> 23:00) with caution
  const nightBriefing = getFallbackNeighborhoodBriefing({
    areaName: "Kurla",
    hour: 23,
    lightingScore: 0.35,
    policeDistanceM: 320,
    nearestPoliceName: "Kurla Station Beat Box",
  });

  assert.strictEqual(nightBriefing.riskLevel, "caution");
  assert.strictEqual(nightBriefing.timeContext, "Late Night (Post-11 PM)");
  assert.match(nightBriefing.briefing, /Kurla/);
  assert.match(nightBriefing.briefing, /10 PM/);
  assert.ok(nightBriefing.highlights.length >= 2);
  assert.ok(nightBriefing.audioBriefingText.length > 10);

  // Daytime (14:00)
  const dayBriefing = getFallbackNeighborhoodBriefing({
    areaName: "Bandra West",
    hour: 14,
    lightingScore: 0.9,
    policeDistanceM: 200,
  });
  assert.strictEqual(dayBriefing.riskLevel, "low");
  assert.strictEqual(dayBriefing.timeContext, "Afternoon");
  assert.match(dayBriefing.briefing, /Bandra West/);
});

test("Feature 4: Dynamic Neighborhood Safety Briefing - Async Fallback Execution", async () => {
  const briefing = await generateNeighborhoodSafetyBriefing({
    areaName: "Kurla",
    hour: 22,
    lightingScore: 0.7,
    policeDistanceM: 280,
  });

  assert.ok(briefing.headline);
  assert.ok(briefing.briefing);
  assert.match(briefing.briefing, /Kurla/);
  assert.ok(Array.isArray(briefing.highlights));
  assert.ok(briefing.highlights.length > 0);
});
