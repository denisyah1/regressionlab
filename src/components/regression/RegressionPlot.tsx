// GET /api/regression/plot no longer exists.
// Plot data is now read directly from the regression result stored in useRegressionStore.
import { useRegressionStore } from "../../store/useRegressionStore";
import GlassCard from "../common/GlassCard";

type Point = { x: number; y: number };

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const parsed = Number(v);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function buildPoints(actual: number[], pred: number[]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < actual.length; i += 1) {
    const x = toNumber(actual[i]);
    const y = toNumber(pred[i]);
    if (x === null || y === null) continue;
    points.push({ x, y });
  }
  return points;
}

export default function RegressionPlot() {
  // Read plot_data directly from the regression result — no extra fetch needed
  const result = useRegressionStore((s) => s.result);
  const plot = result?.plot_data ?? null;

  if (!plot) {
    return (
      <GlassCard>
        <h2>Actual vs Predicted</h2>
        <p className="text-muted">Run regression to see the plot.</p>
      </GlassCard>
    );
  }

  const train = buildPoints(plot.train.y_actual, plot.train.y_pred);
  const test = buildPoints(plot.test.y_actual, plot.test.y_pred);
  const all = [...train, ...test];

  if (all.length === 0) {
    return (
      <GlassCard>
        <h2>Actual vs Predicted</h2>
        <p className="text-muted">No valid plot points to display.</p>
      </GlassCard>
    );
  }

  const min = Math.min(...all.map((p) => Math.min(p.x, p.y)));
  const max = Math.max(...all.map((p) => Math.max(p.x, p.y)));
  const scale = (v: number) => ((v - min) / (max - min || 1)) * 100;

  return (
    <GlassCard>
      <h2>Actual vs Predicted</h2>

      <div className="chart-wrapper" style={{ marginTop: 16 }}>
        <div className="regression-wrapper">
          {/* perfect fit line */}
          <div className="regression-diagonal" />

          {/* train points */}
          {train.map((p, i) => (
            <div
              key={`train-${i}`}
              className="reg-point train"
              data-tooltip={`Train | Actual: ${p.x.toFixed(2)} • Pred: ${p.y.toFixed(2)}`}
              style={{
                left: `${scale(p.x)}%`,
                top: `${100 - scale(p.y)}%`,
              }}
            />
          ))}

          {/* test points */}
          {test.map((p, i) => (
            <div
              key={`test-${i}`}
              className="reg-point test"
              data-tooltip={`Test | Actual: ${p.x.toFixed(2)} • Pred: ${p.y.toFixed(2)}`}
              style={{
                left: `${scale(p.x)}%`,
                top: `${100 - scale(p.y)}%`,
              }}
            />
          ))}

          <div className="reg-axis-x">Actual</div>
          <div className="reg-axis-y">Predicted</div>
        </div>
      </div>

      <div className="text-muted" style={{ marginTop: 12 }}>
        <span style={{ color: "#7dd3fc" }}>●</span> Train &nbsp;
        <span style={{ color: "#ff5c7a" }}>●</span> Test &nbsp;
        <span style={{ opacity: 0.6 }}>— Perfect Fit</span>
      </div>
    </GlassCard>
  );
}