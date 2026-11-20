"""
Unit tests for SafeRoute Gemini Route Explanation Engine (routing/gemini_explainer.py).
Tests grounding constraints, metric synthesis, and deterministic fallback guarantees.
"""
from __future__ import annotations

import unittest
from routing.gemini_explainer import (
    RouteExplanationInputs,
    generate_fallback_explanation,
    generate_gemini_explanation,
)


class TestGeminiExplainer(unittest.TestCase):
    def test_fallback_with_added_time_and_unlit_avoidance(self):
        inputs = RouteExplanationInputs(
            lighting_score=0.72,
            police_dist_m=300.0,
            crime_score=20.0,
            unlit_segments_avoided=3,
            delta_min_vs_fastest=4.0,
            safety_delta_vs_fastest=18.0,
        )
        explanation = generate_fallback_explanation(inputs)
        self.assertIn("adds 4 mins", explanation)
        self.assertIn("avoids 3 unlit service lanes", explanation)
        self.assertIn("keeps you within 300 m", explanation)
        self.assertIn("police beat box", explanation)
        self.assertTrue(explanation.endswith("."))

    def test_fallback_without_added_time(self):
        inputs = RouteExplanationInputs(
            lighting_score=0.85,
            police_dist_m=200.0,
            nearest_police_name="Bandra Police Station",
            crime_score=15.0,
            delta_min_vs_fastest=0.0,
        )
        explanation = generate_fallback_explanation(inputs)
        self.assertTrue(explanation.startswith("This route "))
        self.assertNotIn("adds", explanation)
        self.assertIn("keeps you within 200 m of Bandra Police Station", explanation)

    def test_fallback_escape_and_prospect(self):
        inputs = RouteExplanationInputs(
            lighting_score=0.40,
            police_dist_m=900.0,
            crime_score=50.0,
            entrapment_score=0.80,
            prospect_score=0.65,
            delta_min_vs_fastest=2.0,
        )
        explanation = generate_fallback_explanation(inputs)
        self.assertIn("adds 2 mins", explanation)
        self.assertIn("open intersections with clear escape paths", explanation)

    def test_generate_gemini_explanation_graceful_offline_fallback(self):
        # Without valid GEMINI_API_KEY, should gracefully fall back to deterministic template
        inputs = RouteExplanationInputs(
            lighting_score=0.68,
            police_dist_m=280.0,
            crime_score=22.0,
            unlit_segments_avoided=2,
            delta_min_vs_fastest=3.0,
        )
        explanation = generate_gemini_explanation(inputs, api_key=None)
        self.assertIsInstance(explanation, str)
        self.assertIn("adds 3 mins", explanation)
        self.assertIn("avoids 2 unlit service lanes", explanation)
        self.assertIn("keeps you within 280 m", explanation)

    def test_zero_hallucination_guarantee(self):
        # Ensures no unknown facilities or random landmarks are introduced
        inputs = RouteExplanationInputs(
            lighting_score=0.3,
            police_dist_m=800.0,
            crime_score=40.0,
            delta_min_vs_fastest=1.0,
        )
        explanation = generate_fallback_explanation(inputs)
        # Should not invent names
        self.assertNotIn("Kurla", explanation)
        self.assertNotIn("Linking Road", explanation)


if __name__ == "__main__":
    unittest.main()
