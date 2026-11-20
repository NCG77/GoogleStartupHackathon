"""
Regression test for the built-in UTM 43N projection fallback.

`routing.graph_builder._latlon_to_utm43n` falls back to a hand-written
closed-form Transverse Mercator when geopandas is unavailable. That path
runs inside `snap_to_node`, which executes on every route request, so an
error there would silently corrupt every snapped origin/destination.

This test pins the fallback against pyproj (PROJ) across the Mumbai bbox.

Run:  python -m pytest tests/test_projection.py -v
      (requires: pip install pyproj pytest)
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

pyproj = pytest.importorskip("pyproj", reason="pyproj needed as the reference")

from routing import graph_builder  # noqa: E402
from routing.graph_builder import METRIC_CRS, _latlon_to_utm43n  # noqa: E402

# Corners and interior points spanning MUMBAI_BBOX (72.775, 18.892, 72.986, 19.270)
MUMBAI_POINTS = [
    (19.0760, 72.8777, "Mumbai centre"),
    (18.9220, 72.8347, "Colaba"),
    (19.2183, 72.9781, "Thane edge"),
    (19.1136, 72.8697, "Andheri"),
    (18.8921, 72.8081, "SW corner"),
    (19.2700, 72.9860, "NE corner"),
    (18.8920, 72.9860, "SE corner"),
    (19.2700, 72.7750, "NW corner"),
]

TOLERANCE_M = 0.01  # 1 cm — the fallback should agree with PROJ to <1 mm


@pytest.fixture(scope="module")
def reference_transformer():
    return pyproj.Transformer.from_crs("EPSG:4326", METRIC_CRS, always_xy=True)


@pytest.fixture
def force_fallback(monkeypatch):
    """Force the hand-rolled path even when geopandas is installed."""
    monkeypatch.setattr(graph_builder, "gpd", None)
    monkeypatch.setattr(graph_builder, "_FALLBACK_PROJECTION_WARNED", True)


@pytest.mark.parametrize("lat,lon,name", MUMBAI_POINTS)
def test_fallback_matches_pyproj(lat, lon, name, reference_transformer, force_fallback):
    ref_x, ref_y = reference_transformer.transform(lon, lat)
    got_x, got_y = _latlon_to_utm43n(lat, lon)
    delta = math.hypot(ref_x - got_x, ref_y - got_y)
    assert delta < TOLERANCE_M, (
        f"{name} ({lat}, {lon}): fallback projection is off by {delta:.4f} m "
        f"(reference {ref_x:.3f},{ref_y:.3f} vs got {got_x:.3f},{got_y:.3f}). "
        f"The Transverse Mercator constants in graph_builder may be wrong."
    )


def test_fallback_is_in_expected_utm_range(force_fallback):
    """Sanity: Mumbai in UTM 43N sits around easting 270-290 km, northing ~2.09-2.13 Mm."""
    x, y = _latlon_to_utm43n(19.0760, 72.8777)
    assert 250_000 < x < 300_000, f"easting {x} outside plausible Mumbai range"
    assert 2_080_000 < y < 2_140_000, f"northing {y} outside plausible Mumbai range"


def test_monotonic_northing(force_fallback):
    """Northing must increase with latitude."""
    _, y_south = _latlon_to_utm43n(18.90, 72.88)
    _, y_north = _latlon_to_utm43n(19.25, 72.88)
    assert y_north > y_south
