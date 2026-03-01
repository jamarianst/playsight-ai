const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function getApiUrl(path: string): string {
  return API_URL ? `${API_URL}${path.startsWith("/") ? path : `/${path}`}` : path;
}

export async function uploadFile(file: File): Promise<{ assetId: string; jobId: string; message: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(getApiUrl("/upload"), {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getUploadUrl(filename: string): Promise<{ assetId: string; jobId: string; uploadUrl: string; expiresIn: number }> {
  const res = await fetch(getApiUrl("/upload/url"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getAsset(assetId: string): Promise<AssetResponse> {
  const res = await fetch(getApiUrl(`/assets/${assetId}`));
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface AssetResponse {
  asset: {
    id: string;
    status: string;
    storageKey: string;
    durationSeconds?: number;
    sport?: string | null;
    createdAt: string;
  };
  job: {
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    result?: {
      keyMoments?: Array<{ timestamp: number; type: string; label: string }>;
      highlight?: string;
      heatmap?: string;
    };
    errorMessage?: string | null;
  } | null;
}
