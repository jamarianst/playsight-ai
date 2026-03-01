import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getAsset, type AssetResponse } from "../api";
import { Spinner } from "../components/Spinner";
import { Footer } from "../components/Footer";

const DEMO_ASSET_ID = "demo";

const DEMO_RESULT: AssetResponse = {
  asset: {
    id: DEMO_ASSET_ID,
    status: "completed",
    storageKey: "videos/demo/raw.mp4",
    durationSeconds: 5400,
    sport: "soccer",
    createdAt: new Date().toISOString(),
  },
  job: {
    id: "demo-job",
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    result: {
      keyMoments: [
        { timestamp: 120, type: "goal", label: "Goal – 2'" },
        { timestamp: 340, type: "shot", label: "Shot on target – 5'" },
        { timestamp: 890, type: "key_pass", label: "Key pass – 14'" },
        { timestamp: 1200, type: "recovery", label: "Defensive recovery – 20'" },
      ],
    },
  },
};

function ResultsDashboard({ data }: { data: AssetResponse }) {
  const job = data.job;
  const result = job?.result as { keyMoments?: Array<{ timestamp: number; type: string; label: string }>; highlight?: string; heatmap?: string } | undefined;
  const moments = result?.keyMoments ?? [];

  return (
    <div className="results-dashboard">
      <h2>Your analysis</h2>

      <section className="section highlights">
        <h3>Key moments</h3>
        <ul className="moments-list">
          {moments.length ? (
            moments.map((m, i) => (
              <li key={i}>
                <span className="time">{formatTime(m.timestamp)}</span>
                <span className="label">{m.label}</span>
              </li>
            ))
          ) : (
            <li className="placeholder">Key moments will appear here once processing is complete.</li>
          )}
        </ul>
      </section>

      <section className="section heatmap">
        <h3>Position heatmap</h3>
        <div className="pitch-placeholder">
          <div className="pitch-inner">
            Pitch heatmap — coming in next release
          </div>
        </div>
      </section>

      <section className="section insights">
        <h3>Coaching insights</h3>
        <ul className="insights-list">
          <li>Movement in the final third was strong; consider more runs in behind.</li>
          <li>Defensive shape held well in the middle block.</li>
          <li>Recovery runs could be quicker in transition.</li>
          <li>Set-piece positioning is solid; keep working on delivery.</li>
          <li>Stamina in the last 15 minutes was good.</li>
        </ul>
      </section>

      <section className="section cta">
        <button type="button" className="btn primary" disabled>Download highlight reel</button>
        <button type="button" className="btn secondary" disabled>Share</button>
      </section>

      <p className="back-link"><Link to="/">Analyze another video</Link></p>
      <Footer />
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}'${s.toString().padStart(2, "0")}`;
}

export default function AnalysisPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const [data, setData] = useState<AssetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDemo = assetId === DEMO_ASSET_ID;

  const fetchAsset = useCallback(async (id: string) => {
    const res = await getAsset(id);
    setData(res);
    return res;
  }, []);

  useEffect(() => {
    if (!assetId) return;
    if (isDemo) {
      setData(DEMO_RESULT);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const poll = async () => {
      try {
        const res = await fetchAsset(assetId);
        if (cancelled) return;
        if (res.job?.status === "completed" || res.job?.status === "failed") {
          setData(res);
          setLoading(false);
          return;
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setLoading(false);
        }
        return;
      }
      setTimeout(poll, 2000);
    };
    poll();
    return () => { cancelled = true; };
  }, [assetId, isDemo, fetchAsset]);

  if (error) {
    return (
      <div className="page analysis-page">
        <p className="error">{error}</p>
        <Link to="/">Back to upload</Link>
        <Footer />
      </div>
    );
  }

  if (loading || !data) {
    const status = data?.job?.status ?? "queued";
    const statusLabel =
      status === "pending" || status === "queued"
        ? (data?.job ? "Processing" : "Queued")
        : status === "completed"
          ? "Done"
          : status === "failed"
            ? "Failed"
            : "Processing";
    return (
      <div className="page analysis-page">
        <h1>Analyzing your game</h1>
        <div className="progress-ui">
          <Spinner />
          <div className={`status-badge ${status}`}>{statusLabel}</div>
          <p className="progress-text">
            {status === "pending" || status === "queued"
              ? (data?.job ? "AI is processing your footage…" : "Your video is in the queue…")
              : status === "completed"
                ? "Done!"
                : status === "failed"
                  ? "Something went wrong."
                  : "Processing…"}
          </p>
          <Link to="/">Back to upload</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page analysis-page">
      {isDemo && <p className="demo-banner">Demo — sample results</p>}
      <ResultsDashboard data={data} />
    </div>
  );
}
