import { apiUrl } from "./base";

// Changed from GET to POST.
// The backend no longer saves models to disk, so we can't download by filename.
// Instead we re-submit the same file + params and the backend streams the .pkl directly.
export async function downloadModel(params: {
  file: File;
  target: string;
  features: string[];
  nullStrategy: "drop" | "mean" | "auto";
}): Promise<void> {
  const fd = new FormData();
  fd.append("file", params.file);
  fd.append("target_column", params.target);
  fd.append("feature_columns", params.features.join(","));
  fd.append("null_strategy", params.nullStrategy);

  const res = await fetch(apiUrl("/api/model/download"), {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    throw new Error("Model download failed");
  }

  // Extract filename from Content-Disposition header if available
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename=(.+\.pkl)/);
  const filename = match ? match[1] : "model.pkl";

  // Convert response to blob and trigger browser download
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}