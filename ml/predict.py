"""
SafeRoute Safety Scoring Engine (Rule-based v2).

Computes transparent, axiomatic safety scores for road segments based on:
  - Satellite road lighting (NASA/NOAA VIIRS composites)
  - Police station proximity (exponential continuous decay)
  - Regional crime rates (non-compensatory geometric weighting)
  - Optional streetscape features: entrapment and prospect (v2-full)

Note: Machine-learning models (XGBoost) previously trained with closed-form target
leakage have been retired. All safety scores in SafeRoute are transparent, rule-based
geometric aggregations that enforce non-compensability and continuous decay.
AI (Gemini) is used strictly for contextual route explanations.
"""
from __future__ import annotations

import heapq
import math
import os
import time
from pathlib import Path
from typing import Any, Literal

SafetyEngine = Literal["rule", "rule-v2-core", "rule-v2-full", "ml"]

import numpy as np
import pandas as pd

ML_DIR = Path(__file__).resolve().parent
SCORES_CSV = ML_DIR.parent / "data" / "processed" / "road_safety_scores.csv"

# Active feature columns (hospital_dist resolved/retired per audit B2)
FEATURE_COLS = [
    "lighting_score",
    "police_dist",
    "crime_score",
]
TARGET_COL = "safety_score"

# Default scoring version: "v2-core" (L 0.35, P 0.35, C 0.30)
# Set SAFEROUTE_SCORE_VERSION="v2-full" to enable entrapment & prospect
SCORE_VERSION = os.environ.get("SAFEROUTE_SCORE_VERSION", "v2-core").strip().lower()

# Constants for Safety Score v2
EPS = 0.05      # Floor; prevents one zero annihilating the geometric product
D0 = 1000.0     # Police decay constant in metres

# Legacy weights maintained for v1 reference
W_LIGHT = 0.35
W_POLICE = 0.35
W_CRIME = 0.30

# Street widths for prospect calculation
FCLASS_DEFAULT_WIDTH_M = {
    "motorway": 14.0, "trunk": 12.0, "primary": 11.0,
    "secondary": 9.0, "tertiary": 7.5, "residential": 6.0,
    "service": 4.0,   "footway": 2.5,  "path": 2.0,
}

_feature_table: pd.DataFrame | None = None
_score_by_road: dict[str, float] | None = None
_community_bias: tuple[dict[str, float], dict[str, float]] | None = None


def _clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def police_score_v1(dist_m: float | None) -> float:
    """Legacy piecewise police proximity score (v1)."""
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


def police_score_v2(dist_m: float | None) -> float:
    """Smooth, unbounded-decay police proximity score."""
    if dist_m is None or (isinstance(dist_m, float) and (np.isnan(dist_m) or math.isnan(dist_m))):
        return EPS
    return _clamp(math.exp(-float(dist_m) / D0), EPS, 1.0)


# Default police_score alias points to v2
police_score = police_score_v2


def safety_score_v2(
    lighting_score: float,
    police_dist: float,
    crime_score: float,
    entrapment: float | None = None,
    prospect: float | None = None,
) -> float:
    """
    Weighted geometric mean of normalised safety components.

    Non-compensatory: a near-zero value in any component drags the whole
    score down, unlike the previous linear form where a strong component
    could mask a catastrophic one.

    All components are normalised to [EPS, 1.0] where 1.0 = safest.
    Weights renormalise over whichever components are present, so the
    function degrades gracefully when optional features are missing.
    """
    L = _clamp(float(lighting_score), EPS, 1.0)
    P = police_score_v2(police_dist)
    C = _clamp(1.0 - float(crime_score) / 100.0, EPS, 1.0)

    terms: list[tuple[float, float]] = [
        (L, 0.35),
        (P, 0.35),
        (C, 0.30),
    ]
    if entrapment is not None:
        terms.append((_clamp(float(entrapment), EPS, 1.0), 0.16))
    if prospect is not None:
        terms.append((_clamp(float(prospect), EPS, 1.0), 0.10))

    total_w = sum(w for _, w in terms)
    score = 100.0
    for value, weight in terms:
        score *= value ** (weight / total_w)
    return _clamp(score, 0.0, 100.0)


def count_nodes_within(graph: Any, start_node: Any, radius_m: float, min_degree: int = 3) -> int:
    """Count nodes of degree >= min_degree reachable within radius_m along the graph."""
    if graph is None or start_node not in graph:
        return 0
    visited: dict[Any, float] = {start_node: 0.0}
    heap = [(0.0, start_node)]
    matching_nodes = 0

    while heap:
        d, u = heapq.heappop(heap)
        if d > radius_m:
            break
        if u != start_node and graph.degree(u) >= min_degree:
            matching_nodes += 1
            if matching_nodes >= 3:
                return 3
        for v, data in graph[u].items():
            attrs = data.get("attrs")
            length = getattr(attrs, "length_m", None) or (data.get("length_m") or 10.0)
            new_d = d + float(length)
            if new_d <= radius_m and (v not in visited or new_d < visited[v]):
                visited[v] = new_d
                heapq.heappush(heap, (new_d, v))
    return matching_nodes


def entrapment_score(node_id: Any, graph: Any, radius_m: float = 100.0) -> float:
    """
    1.0 = many escape routes nearby; EPS = dead end with no alternatives.

    Counts graph nodes of degree >= 3 (real intersections) reachable within
    `radius_m`. Three or more intersections within 100 m is treated as fully
    safe on this axis. A dead end applies a hard penalty.
    """
    if graph is None or node_id not in graph:
        return 0.5
    intersections = count_nodes_within(graph, node_id, radius_m, min_degree=3)
    base = _clamp(intersections / 3.0, 0.0, 1.0)
    is_dead_end = graph.degree(node_id) <= 1
    if is_dead_end:
        base *= 0.4
    return _clamp(base, EPS, 1.0)


def prospect_score(edge: Any, graph: Any = None) -> float:
    """
    1.0 = wide and straight (you can see far ahead);
    EPS = narrow and winding.

    width: OSM `width` tag -> `lanes` * 3.5 -> fclass default
    straightness: euclidean distance / path length  (1.0 = perfectly straight)
    """
    if isinstance(edge, dict):
        fclass = edge.get("fclass")
        width_val = edge.get("width")
        lanes_val = edge.get("lanes")
        coords = edge.get("coords") or []
        path_len = edge.get("length_m", 0.0)
    else:
        fclass = getattr(edge, "fclass", "")
        width_val = getattr(edge, "width", None)
        lanes_val = getattr(edge, "lanes", None)
        coords = getattr(edge, "coords", [])
        path_len = getattr(edge, "length_m", 0.0)

    width_m = (
        width_val
        or (float(lanes_val) * 3.5 if lanes_val else None)
        or FCLASS_DEFAULT_WIDTH_M.get(str(fclass), 6.0)
    )
    width_norm = _clamp(float(width_m) / 12.0, 0.0, 1.0)

    if coords and len(coords) >= 2:
        lat0, lon0 = coords[0]
        lat1, lon1 = coords[-1]
        dlat = (lat1 - lat0) * 111139.0
        dlon = (lon1 - lon0) * 111139.0 * math.cos(math.radians(lat0))
        euclidean_m = math.hypot(dlat, dlon)
    else:
        euclidean_m = path_len

    straightness = _clamp(
        float(euclidean_m) / max(float(path_len), 1e-6),
        0.0,
        1.0,
    )
    return _clamp(0.6 * width_norm + 0.4 * straightness, EPS, 1.0)


def rule_safety_score(
    lighting_score: float,
    police_dist: float,
    crime_score: float,
    hospital_dist: float | None = None,
) -> float:
    """Deterministic rule-based safety score (Safety Score v2)."""
    return safety_score_v2(lighting_score, police_dist, crime_score)


def load_model() -> None:
    """The legacy XGBoost model has been retired in favor of Safety Score v2."""
    return None


def predict_safety(
    lighting_score: float,
    police_dist: float,
    crime_score: float,
    hospital_dist: float = 2000.0,
    **kwargs: Any,
) -> float:
    """Returns the rule-based v2 safety score (XGBoost model retired)."""
    return safety_score_v2(lighting_score, police_dist, crime_score)


def load_community_bias_cached(force: bool = False) -> tuple[dict[str, float], dict[str, float]]:
    """(day, night) community bias maps."""
    global _community_bias
    if _community_bias is not None and not force:
        return _community_bias
    try:
        from .community_intelligence import load_community_bias_layers
        _community_bias = load_community_bias_layers()
    except Exception as exc:  # noqa: BLE001
        print(f"  community bias unavailable ({exc})", flush=True)
        _community_bias = ({}, {})
    return _community_bias


def reload_data(*, scores: bool = True, bias: bool = True) -> None:
    """Drop cached CSV / scores / bias so the next apply re-reads disk."""
    global _feature_table, _score_by_road, _community_bias
    if scores:
        _feature_table = None
        _score_by_road = None
    if bias:
        _community_bias = None


def load_feature_table(csv_path: Path = SCORES_CSV) -> pd.DataFrame:
    global _feature_table
    if _feature_table is not None:
        return _feature_table
    df = pd.read_csv(csv_path, dtype={"road_id": str})
    keep = ["road_id", *FEATURE_COLS, TARGET_COL]
    missing = [c for c in keep if c not in df.columns]
    if missing:
        raise ValueError(f"Feature CSV missing: {missing}")
    table = df[keep].drop_duplicates("road_id").set_index("road_id")
    _feature_table = table
    return table


def _base_road_id(edge_road_id: str) -> str:
    return str(edge_road_id).split(":", 1)[0]


def _time_shift_maps(table: pd.DataFrame) -> tuple[dict[str, float], dict[str, float]]:
    """Per road: shift when re-weighted for day vs night."""
    from routing.dynamic_risk import DAY_WEIGHTS, NIGHT_WEIGHTS, STATIC_WEIGHTS

    L = table["lighting_score"].astype(float).clip(EPS, 1.0)
    P = table["police_dist"].astype(float).map(police_score_v2)
    C = (1.0 - table["crime_score"].astype(float).clip(0.0, 100.0) / 100.0).clip(EPS, 1.0)

    def score(w: tuple[float, float, float]) -> pd.Series:
        w_sum = sum(w)
        wL, wP, wC = w[0] / w_sum, w[1] / w_sum, w[2] / w_sum
        return 100.0 * (L ** wL) * (P ** wP) * (C ** wC)

    static = score(STATIC_WEIGHTS)
    ids = table.index.astype(str)
    day_shift = score(DAY_WEIGHTS) - static
    night_shift = score(NIGHT_WEIGHTS) - static
    day = dict(zip(ids, (day_shift - day_shift.mean()).round(2)))
    night = dict(zip(ids, (night_shift - night_shift.mean()).round(2)))
    return day, night


def apply_safety_to_graph(
    rg: Any,
    engine: str = "rule",
    **kwargs: Any,
) -> dict[str, Any]:
    """
    Set per-edge safety used by A*:
      safety_day / safety_night = base + time-of-day shift − community bias
      safety                    = value at the current Mumbai hour

    Uses the transparent rule-based v2 safety score.
    """
    from routing.dynamic_risk import edge_safety_at, night_factor

    t0 = time.time()
    table = load_feature_table()
    shift_day, shift_night = _time_shift_maps(table)
    lighting = table["lighting_score"].astype(float).to_dict()
    bias_day_map, bias_night_map = load_community_bias_cached()
    nf_now = night_factor()
    biased_roads = 0

    score_version = SCORE_VERSION
    use_full = (score_version == "v2-full")

    updated = 0
    for u, v, data in rg.graph.edges(data=True):
        attrs = data.get("attrs")
        if attrs is None:
            continue
        base_id = _base_road_id(attrs.road_id)

        # Base v2 score
        if base_id in table.index:
            row = table.loc[base_id]
            l_val = float(row["lighting_score"])
            p_val = float(row["police_dist"])
            c_val = float(row["crime_score"])
        else:
            l_val = float(getattr(attrs, "lighting_score", 0.5) or 0.5)
            p_val = float(getattr(attrs, "police_dist", 1000.0) or 1000.0)
            c_val = float(getattr(attrs, "crime_score", 40.0) or 40.0)

        entrap = entrapment_score(u, rg.graph) if use_full else None
        prosp = prospect_score(attrs, rg.graph) if use_full else None
        base = safety_score_v2(l_val, p_val, c_val, entrapment=entrap, prospect=prosp)

        attrs.safety_rule = base
        b_day = float(bias_day_map.get(base_id, 0.0))
        b_night = float(bias_night_map.get(base_id, 0.0))
        if b_day > 0 or b_night > 0:
            biased_roads += 1
        attrs.bias_day = b_day
        attrs.bias_night = b_night
        attrs.safety_day = max(0.0, min(100.0, base + shift_day.get(base_id, 0.0) - b_day))
        attrs.safety_night = max(0.0, min(100.0, base + shift_night.get(base_id, 0.0) - b_night))
        if base_id in lighting:
            attrs.lighting_score = float(lighting[base_id])
        attrs.safety = edge_safety_at(attrs, nf_now)
        updated += 1

    meta = {
        "safety_engine": f"rule-{score_version}",
        "requested_engine": engine,
        "ml_loaded": False,
        "score_version": score_version,
        "edges_updated": updated,
        "community_bias_roads": biased_roads,
        "community_bias_loaded": bool(bias_day_map or bias_night_map),
        "apply_s": round(time.time() - t0, 2),
    }
    rg.meta.update(meta)
    print(
        f"  safety engine=rule-{score_version} "
        f"community_bias_roads={biased_roads} "
        f"edges={updated:,} ({meta['apply_s']}s)",
        flush=True,
    )
    return meta
