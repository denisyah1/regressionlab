import { useNavigate } from "react-router-dom";
import GlassCard from "../components/common/GlassCard";

import DownloadModelCard from "../components/regression/DownloadModelCard";
import FeatureSelector from "../components/regression/FeatureSelector";
import NullStrategySelector from "../components/regression/NullStrategySelector";
import RecommendationCard from "../components/regression/RecommendationCard";
import RegressionPlot from "../components/regression/RegressionPlot";
import RegressionResult from "../components/regression/RegressionResult";
import TargetSelector from "../components/regression/TargetSelector";

import { runRegression } from "../api/regression.api";
import { useDatasetStore } from "../store/useDatasetStore";
import { useRegressionStore } from "../store/useRegressionStore";

// getRegressionPlot import removed — plot data now comes from the regression result directly.
// plot state removed — result.plot_data is read inside RegressionPlot component via the store.

export default function RegressionPage() {
  const navigate = useNavigate();

  const { file, eda } = useDatasetStore();
  const {
    target,
    features,
    nullStrategy,
    result,
    loading,
    error,
    setTarget,
    setFeatures,
    setNullStrategy,
    setResult,
    setLoading,
    setError,
  } = useRegressionStore();

  const canRun =
    !!file &&
    !!eda &&
    target.length > 0 &&
    features.length > 0 &&
    !features.includes(target);

  const handleRun = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runRegression({ file, target, features, nullStrategy });
      setResult(res);
      // plot_data is inside res — RegressionPlot reads it from the store automatically
    } catch {
      setError("Regression failed");
    } finally {
      setLoading(false);
    }
  };

  // useEffect for getRegressionPlot removed entirely

  const buildPlotSvg = () => {
    const data = result?.plot_data;
    if (!data) return "<p style=\"color:#64748b\">Plot not available.</p>";

    const toNumber = (v: unknown): number | null => {
      if (typeof v === "number" && Number.isFinite(v)) return v;
      if (typeof v === "string") {
        const parsed = Number(v);
        if (Number.isFinite(parsed)) return parsed;
      }
      return null;
    };

    const buildPoints = (actual: number[], pred: number[]) => {
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < actual.length; i += 1) {
        const x = toNumber(actual[i]);
        const y = toNumber(pred[i]);
        if (x === null || y === null) continue;
        points.push({ x, y });
      }
      return points;
    };

    const train = buildPoints(data.train.y_actual, data.train.y_pred);
    const test = buildPoints(data.test.y_actual, data.test.y_pred);
    const all = [...train, ...test];

    if (all.length === 0) {
      return `<p style="color:#64748b">No valid plot points to display.</p>`;
    }

    const min = Math.min(...all.map((p) => Math.min(p.x, p.y)));
    const max = Math.max(...all.map((p) => Math.max(p.x, p.y)));
    const scale = (v: number) => ((v - min) / (max - min || 1)) * 100;

    const trainCircles = train
      .map(
        (p) =>
          `<circle cx="${scale(p.x)}" cy="${100 - scale(p.y)}" r="1.4" fill="rgba(125, 211, 252, 0.95)" />`
      )
      .join("");

    const testCircles = test
      .map(
        (p) =>
          `<circle cx="${scale(p.x)}" cy="${100 - scale(p.y)}" r="1.4" fill="rgba(255, 90, 90, 0.95)" />`
      )
      .join("");

    return `
      <div class="chart-wrapper" style="margin-top:16px">
        <div class="regression-wrapper" style="height:320px">
          <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="none">
            <rect x="0" y="0" width="100" height="100" fill="#0b1220" />
            <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.5)" stroke-width="0.6" />
            ${trainCircles}
            ${testCircles}
          </svg>
          <div class="reg-axis-x">Actual</div>
          <div class="reg-axis-y">Predicted</div>
        </div>
      </div>
      <div class="legend">
        <span style="color:#7dd3fc">●</span> Train &nbsp;
        <span style="color:#ff5c7a">●</span> Test &nbsp;
        <span style="opacity:0.6">— Perfect Fit</span>
      </div>
    `;
  };

  const handleDownloadPdf = () => {
    if (!result) return;

    const plotHtml = buildPlotSvg();
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Regression Report</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
              margin: 24px;
              color: #0f172a;
              background: #ffffff;
            }
            h1, h2, h3 { margin: 0 0 8px 0; }
            .pdf-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 16px;
            }
            .chart-wrapper {
              position: relative;
              background: #0b1220;
              border: 2px solid #94a3b8;
              border-radius: 16px;
              padding: 16px;
            }
            .regression-wrapper {
              position: relative;
              height: 320px;
              overflow: hidden;
            }
            .reg-axis-x, .reg-axis-y {
              position: absolute;
              font-size: 11px;
              color: rgba(255,255,255,0.7);
            }
            .reg-axis-x { bottom: -18px; left: 50%; transform: translateX(-50%); }
            .reg-axis-y { top: 50%; left: -28px; transform: rotate(-90deg) translateX(-50%); transform-origin: left top; }
            .legend { margin-top: 10px; font-size: 12px; color: #334155; }
          </style>
        </head>
        <body>
          <h1>Regression Report</h1>
          <div class="pdf-card">
            <h2>Best Model Summary</h2>
            <p><strong>Best Model:</strong> ${result.best_model}</p>
            ${
              result.model_comparison[result.best_model]
                ? `<p>
                    <strong>Test R²:</strong> ${
                      result.model_comparison[result.best_model].test_r2 ?? "N/A"
                    } &nbsp;|&nbsp;
                    <strong>Test MSE:</strong> ${
                      result.model_comparison[result.best_model].test_mse ?? "N/A"
                    }
                   </p>`
                : ""
            }
          </div>
          ${plotHtml}
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=1100,height=800");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  return (
    <div className="page-container">
      {/* HEADER */}
      <GlassCard>
        <button onClick={() => navigate("/eda")}>← Back to EDA</button>
        <h1>Regression Setup</h1>
        <p className="text-secondary">
          Configure and run regression based on EDA insights.
        </p>
      </GlassCard>

      {/* CONFIG */}
      {eda && (
        <>
          <RecommendationCard />

          <TargetSelector
            numericColumns={eda.columns.numeric}
            value={target}
            onChange={setTarget}
          />

          <FeatureSelector
            numericColumns={eda.columns.numeric}
            categoricalColumns={eda.columns.categorical}
            value={features}
            onChange={setFeatures}
          />

          <NullStrategySelector value={nullStrategy} onChange={setNullStrategy} />

          <GlassCard>
            <button disabled={!canRun || loading} onClick={handleRun}>
              {loading ? "Running regression…" : "Run Regression"}
            </button>
            {error && <p className="text-error">{error}</p>}
          </GlassCard>
        </>
      )}

      {/* RESULT */}
      {result && (
        <>
          <RegressionResult result={result} />
          <div id="regression-pdf">
            <div className="pdf-card">
              <h2>Best Model Summary</h2>
              <p>
                <strong>Best Model:</strong> {result.best_model}
              </p>
              {result.model_comparison[result.best_model] && (
                <p>
                  <strong>Test R²:</strong>{" "}
                  {result.model_comparison[result.best_model].test_r2 ?? "N/A"}{" "}
                  &nbsp;|&nbsp;
                  <strong>Test MSE:</strong>{" "}
                  {result.model_comparison[result.best_model].test_mse ?? "N/A"}
                </p>
              )}
            </div>
            <RegressionPlot />
          </div>
          {/* DownloadModelCard no longer needs a filename prop */}
          <DownloadModelCard />
          <GlassCard>
            <button onClick={handleDownloadPdf}>Download PDF Report</button>
          </GlassCard>
        </>
      )}
    </div>
  );
}