import { useState } from "react";
import { downloadModel } from "../../api/model.api";
import { useDatasetStore } from "../../store/useDatasetStore";
import { useRegressionStore } from "../../store/useRegressionStore";
import GlassCard from "../common/GlassCard";

export default function DownloadModelCard() {
  // No longer accepts a filename prop — model is re-streamed from the backend.
  // We need the original file + params to re-run the model on the server.
  const file = useDatasetStore((s) => s.file);
  const { target, features, nullStrategy } = useRegressionStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      await downloadModel({ file, target, features, nullStrategy });
    } catch {
      setError("Download failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <h3>Download Trained Model</h3>

      <p className="text-muted">
        Your best-performing regression model is ready.
      </p>

      {error && <p className="text-error">{error}</p>}

      <button
        onClick={handleDownload}
        disabled={loading || !file}
        style={{
          marginTop: 12,
          padding: "10px 16px",
          borderRadius: 10,
          background: "rgba(125, 211, 252, 0.2)",
          border: "1px solid rgba(125, 211, 252, 0.4)",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Downloading…" : "Download Model (.pkl)"}
      </button>
    </GlassCard>
  );
}