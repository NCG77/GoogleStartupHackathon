"""SafeRoute Phase 3 routing: graph + A* + FastAPI."""

try:
    from .astar_router import RouteResult, astar_route, result_to_dict, route_all_modes
    from .cost_function import MODE_ALPHA, edge_cost, mode_alpha
    from .graph_builder import RoutingGraph, load_graph
except ImportError:
    RouteResult = None  # type: ignore
    astar_route = None  # type: ignore
    result_to_dict = None  # type: ignore
    route_all_modes = None  # type: ignore
    MODE_ALPHA = None  # type: ignore
    edge_cost = None  # type: ignore
    mode_alpha = None  # type: ignore
    RoutingGraph = None  # type: ignore
    load_graph = None  # type: ignore

from .gemini_explainer import (
    RouteExplanationInputs,
    generate_fallback_explanation,
    generate_gemini_explanation,
)

__all__ = [
    "MODE_ALPHA",
    "RouteExplanationInputs",
    "RouteResult",
    "RoutingGraph",
    "astar_route",
    "edge_cost",
    "generate_fallback_explanation",
    "generate_gemini_explanation",
    "load_graph",
    "mode_alpha",
    "result_to_dict",
    "route_all_modes",
]

