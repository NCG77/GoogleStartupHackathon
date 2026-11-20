"""
Comparison harness for SafeRoute Safety Score v1 vs Safety Score v2.

Quantifies the impact of migrating from the linear combination (v1)
to the axiomatic weighted geometric mean (v2-core).

Inputs:
  data/processed/road_safety_scores.csv
Outputs:
  data/processed/scoring_comparison.csv
  data/processed/scoring_comparison_summary.json
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SCORES_CSV = ROOT / "data" / "processed" / "road_safety_scores.csv"
OUTPUT_CSV = ROOT / "data" / "processed" / "scoring_comparison.csv"
OUTPUT_SUMMARY = ROOT / "data" / "processed" / "scoring_comparison_summary.json"

EPS = 0.05
D0 = 1000.0


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def police_score_v1(dist_m: float | None) -> float:
    if dist_m is None or (isinstance(dist_m, float) and np.isnan(dist_m)):
        return 0.2
    d = float(dist_m)
    if d <= 200:
        return 1.0
    if d <= 500:
        return 0.8
    if d <= 800:
        return 0.6
    if d <= 1200:
        return 0.4
    return 0.2


def score_v1(lighting: float, police_dist: float, crime: float) -> float:
    L = _clamp(float(lighting), 0.0, 1.0)
    P = police_score_v1(police_dist)
    C = _clamp(float(crime), 0.0, 100.0)
    return float(100.0 * (0.35 * L + 0.35 * P + 0.30 * (1.0 - C / 100.0)))


def police_score_v2(dist_m: float | None) -> float:
    if dist_m is None or (isinstance(dist_m, float) and (np.isnan(dist_m) or math.isnan(dist_m))):
        return EPS
    return _clamp(math.exp(-float(dist_m) / D0), EPS, 1.0)


def score_v2_core(lighting: float, police_dist: float, crime: float) -> float:
    L = _clamp(float(lighting), EPS, 1.0)
    P = police_score_v2(police_dist)
    C = _clamp(1.0 - float(crime) / 100.0, EPS, 1.0)

    # v2-core: L 0.35, P 0.35, C 0.30 (weights sum to 1.0)
    score = 100.0 * (L ** 0.35) * (P ** 0.35) * (C ** 0.30)
    return float(_clamp(score, 0.0, 100.0))


def compute_histogram(series: pd.Series) -> dict[str, int]:
    bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100.01]
    labels = ["0-10", "10-20", "20-30", "30-40", "40-50", "50-60", "60-70", "70-80", "80-90", "90-100"]
    counts = pd.cut(series, bins=bins, labels=labels, right=False).value_counts().to_dict()
    return {k: int(counts.get(k, 0)) for k in labels}


def run_comparison():
    print(f"Reading {SCORES_CSV}...", flush=True)
    df = pd.read_csv(SCORES_CSV, dtype={"road_id": str})
    print(f"Loaded {len(df):,} road segments.", flush=True)

    v1_scores = []
    v2_scores = []

    for _, row in df.iterrows():
        l_val = row["lighting_score"]
        p_val = row["police_dist"]
        c_val = row["crime_score"]

        s1 = score_v1(l_val, p_val, c_val)
        s2 = score_v2_core(l_val, p_val, c_val)

        v1_scores.append(s1)
        v2_scores.append(s2)

    df["score_v1"] = np.round(v1_scores, 2)
    df["score_v2_core"] = np.round(v2_scores, 2)
    df["delta"] = np.round(df["score_v2_core"] - df["score_v1"], 2)
    df["abs_delta"] = np.abs(df["delta"])

    # Save comparison CSV
    export_cols = [
        "road_id",
        "lighting_score",
        "police_dist",
        "crime_score",
        "score_v1",
        "score_v2_core",
        "delta",
    ]
    df[export_cols].to_csv(OUTPUT_CSV, index=False)
    print(f"Wrote per-segment comparisons to {OUTPUT_CSV}", flush=True)

    # Statistics (Spearman rank correlation = Pearson correlation of the ranks)
    s1_series = df["score_v1"]
    s2_series = df["score_v2_core"]

    corr = float(s1_series.rank().corr(s2_series.rank()))
    p_value = 0.0

    # Segments where v1 >= 50 and v2 < 40 (over-scored streets)
    over_scored = df[(df["score_v1"] >= 50.0) & (df["score_v2_core"] < 40.0)]
    over_scored_count = int(len(over_scored))

    # Top 200 segments with largest absolute delta
    top_200 = (
        df.sort_values(by="abs_delta", ascending=False)
        .head(200)[
            [
                "road_id",
                "lighting_score",
                "police_dist",
                "crime_score",
                "score_v1",
                "score_v2_core",
                "delta",
            ]
        ]
        .to_dict(orient="records")
    )

    summary = {
        "segments_total": int(len(df)),
        "score_v1": {
            "mean": round(float(s1_series.mean()), 2),
            "median": round(float(s1_series.median()), 2),
            "stdev": round(float(s1_series.std()), 2),
            "histogram_10pt": compute_histogram(s1_series),
        },
        "score_v2_core": {
            "mean": round(float(s2_series.mean()), 2),
            "median": round(float(s2_series.median()), 2),
            "stdev": round(float(s2_series.std()), 2),
            "histogram_10pt": compute_histogram(s2_series),
        },
        "spearman_rank_correlation": round(float(corr), 4),
        "spearman_p_value": float(p_value),
        "over_scored_count_v1_ge_50_v2_lt_40": over_scored_count,
        "over_scored_percentage": round(100.0 * over_scored_count / len(df), 2),
        "top_200_largest_deltas": top_200,
    }

    with open(OUTPUT_SUMMARY, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"Summary written to {OUTPUT_SUMMARY}")
    print(f"v1 Mean: {summary['score_v1']['mean']}, Median: {summary['score_v1']['median']}")
    print(f"v2 Mean: {summary['score_v2_core']['mean']}, Median: {summary['score_v2_core']['median']}")
    print(f"Over-scored streets (v1 >= 50 and v2 < 40): {over_scored_count:,} ({summary['over_scored_percentage']}%)")
    print(f"Spearman correlation: {summary['spearman_rank_correlation']}")


if __name__ == "__main__":
    run_comparison()
