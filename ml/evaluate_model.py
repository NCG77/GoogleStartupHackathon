"""
Evaluate SafeRoute Scoring Engine.

The legacy XGBoost model evaluation has been retired.
To evaluate and compare Safety Score v2 against legacy linear baseline, run:
  python -m ml.compare_scoring
"""
import sys

def main():
    print("Legacy XGBoost model evaluation is retired.")
    print("Run `python -m ml.compare_scoring` to verify Safety Score v2 against axiomatic metrics.")
    sys.exit(0)

if __name__ == "__main__":
    main()

ML_DIR = Path(__file__).resolve().parent


def evaluate_saved(
    model_path: Path = MODEL_PATH,
    csv_path: Path = DATA_CSV,
) -> dict[str, float]:
    bundle = load_model(model_path)
    model = bundle["model"]
    features = bundle.get("features") or FEATURE_COLS

    _, X, y = load_xy(csv_path)
    # Same split as training so test metrics are comparable
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    # Re-order columns if bundle feature order differs from FEATURE_COLS
    if list(features) != list(FEATURE_COLS):
        # X was built with FEATURE_COLS order; rebuild if needed
        import pandas as pd

        df = pd.read_csv(csv_path)
        clean = df[list(features) + [TARGET_COL]].dropna()
        X_all = clean[list(features)].astype(float).values
        y_all = clean[TARGET_COL].astype(float).values
        _, X_test, _, y_test = train_test_split(
            X_all, y_all, test_size=TEST_SIZE, random_state=RANDOM_STATE
        )

    pred = np.clip(model.predict(X_test), 0.0, 100.0)
    metrics = {
        "mae": round(float(mean_absolute_error(y_test, pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_test, pred))), 4),
        "r2": round(float(r2_score(y_test, pred)), 4),
        "n_test": int(len(y_test)),
    }

    print("Phase 4 XGBoost evaluation (held-out 20%)")
    print(f"  MAE  = {metrics['mae']:.2f}")
    print(f"  RMSE = {metrics['rmse']:.2f}")
    print(f"  R²   = {metrics['r2']:.4f}")
    print(f"  n    = {metrics['n_test']:,}")

    if METRICS_PATH.exists():
        with METRICS_PATH.open(encoding="utf-8") as f:
            saved = json.load(f)
        print("  (metrics.json test block:", saved.get("test"), ")")

    return metrics


def main() -> None:
    evaluate_saved()


if __name__ == "__main__":
    main()
