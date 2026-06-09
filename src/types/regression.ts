import type { RegressionPlotResponse } from "./plot";

export interface ModelMetric {
  train_r2?: number | null;
  test_r2?: number | null;
  test_mse?: number | null;
}

export interface RegressionResponse {
  best_model: string;
  model_comparison: Record<string, ModelMetric>;
  feature_engineering: {
    numeric_features: string[];
    categorical_features: string[];
  };
  data_info: {
    rows: number;
    train_rows: number;
    test_rows: number;
    null_strategy: string;
  };
  // plot_data is now returned directly inside the regression response.
  // The separate GET /api/regression/plot endpoint no longer exists.
  plot_data: RegressionPlotResponse;

  // saved_model_filename removed — models are no longer saved to disk.
  // Use POST /api/model/download to re-run and stream the model directly.
}