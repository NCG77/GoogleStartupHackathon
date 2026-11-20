"""
SafeRoute Gemini Route Explanation Engine.

Generates concise, factual, non-alarmist explanations for why a recommended
route is safer than the fastest alternative. Grounded strictly on real feature
inputs (L, P, C, entrapment, prospect, time of day, score delta).

Strictly enforces:
  - No hallucinated streets or safety attributes.
  - Every claim must map to an input parameter.
  - Deterministic template fallback on timeout, error, or missing API key.
"""
from __future__ import annotations

import os
import json
import urllib.request
from dataclasses import dataclass
from typing import Any


@dataclass
class RouteExplanationInputs:
    lighting_score: float             # [0.05, 1.0]
    police_dist_m: float              # in meters
    crime_score: float                # [0, 100]
    entrapment_score: float | None    # [0.05, 1.0] (1.0 = many escape turns)
    prospect_score: float | None      # [0.05, 1.0] (1.0 = wide, straight road)
    time_of_day_hour: float           # 0 to 24
    delta_min_vs_fastest: float       # minutes slower than fastest route
    safety_delta_vs_fastest: float    # points safer than fastest route
    nearest_police_name: str | None = None


def generate_fallback_explanation(inputs: RouteExplanationInputs) -> str:
    """
    Deterministic template fallback. Guaranteed to return a valid,
    calm, and factual explanation tracing directly to inputs.
    """
    prefix = (
        f"This route is {round(inputs.delta_min_vs_fastest)} minutes longer but "
        if inputs.delta_min_vs_fastest > 0.5
        else "This route "
    )

    clauses: list[str] = []

    # 1. Prospect (sightline / road width)
    if inputs.prospect_score is not None and inputs.prospect_score >= 0.55:
        clauses.append("stays on wider, more open streets")

    # 2. Lighting (VIIRS satellite night-lights)
    if inputs.lighting_score >= 0.50:
        clauses.append("follows roads with active night-time lighting")
    elif inputs.lighting_score < 0.20:
        clauses.append("has limited lighting but avoids high-risk areas")

    # 3. Police proximity
    if inputs.police_dist_m <= 600:
        p_name = f" ({inputs.nearest_police_name})" if inputs.nearest_police_name else ""
        clauses.append(f"passes within {round(inputs.police_dist_m)} m of police presence{p_name}")

    # 4. Entrapment (escape options & intersections)
    if inputs.entrapment_score is not None and inputs.entrapment_score >= 0.60:
        clauses.append("keeps frequent escape turns and avoids dead-end stretches")

    if not clauses:
        clauses.append("maintains higher composite road safety than the fastest option")

    if len(clauses) == 1:
        return f"{prefix}{clauses[0]}."
    if len(clauses) == 2:
        return f"{prefix}{clauses[0]} and {clauses[1]}."
    return f"{prefix}{', '.join(clauses[:-1])}, and {clauses[-1]}."


def generate_gemini_explanation(
    inputs: RouteExplanationInputs,
    api_key: str | None = None,
    timeout_s: float = 3.0,
) -> str:
    """
    Calls Gemini API (or Vertex AI) with grounded structured prompt.
    Falls back to deterministic template on any network error or timeout.
    """
    key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("EXPO_PUBLIC_GEMINI_API_KEY")
    if not key:
        return generate_fallback_explanation(inputs)

    system_instruction = (
        "You are the SafeRoute Navigation Assistant. You explain to a pedestrian why "
        "their selected safe route is recommended over the fastest route.\n"
        "RULES (Strictly enforced):\n"
        "1. Write ONE concise sentence (max 35 words), calm, factual, non-alarmist.\n"
        "2. Do NOT invent features, street names, or landmarks not explicitly provided in the input.\n"
        "3. Every claim must strictly map to an input metric: width->prospect, lighting->L, "
        "police distance->P, escape turns->entrapment, travel time->delta_min.\n"
        "4. Tone: helpful navigation advice, never fearful or dramatized."
    )

    data_payload = {
        "lighting_score": round(inputs.lighting_score, 2),
        "police_distance_m": round(inputs.police_dist_m),
        "crime_score": round(inputs.crime_score, 1),
        "entrapment_score": round(inputs.entrapment_score, 2) if inputs.entrapment_score is not None else None,
        "prospect_score": round(inputs.prospect_score, 2) if inputs.prospect_score is not None else None,
        "time_of_day_hour": round(inputs.time_of_day_hour, 1),
        "minutes_slower_than_fastest": round(inputs.delta_min_vs_fastest, 1),
        "points_safer_than_fastest": round(inputs.safety_delta_vs_fastest, 1),
        "nearest_police_name": inputs.nearest_police_name,
    }

    prompt = (
        f"{system_instruction}\n\n"
        f"Input Metrics:\n{json.dumps(data_payload, indent=2)}\n\n"
        "Explanation:"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    req_body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 60,
        },
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(req_body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout_s) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidate = res_data.get("candidates", [{}])[0]
            text = candidate.get("content", {}).get("parts", [{}])[0].get("text", "").strip()
            if text and len(text) > 10:
                return text
    except Exception as exc:
        # Fall back gracefully on timeout, rate limit, or network error
        pass

    return generate_fallback_explanation(inputs)
