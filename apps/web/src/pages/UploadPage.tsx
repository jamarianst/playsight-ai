import { useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { uploadFile } from "../api";
import { VideoIcon } from "../components/Icons";
import { Footer } from "../components/Footer";

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("video/")) setFile(f);
    else if (f) setError("Please choose a video file.");
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("video/")) setFile(f);
    else if (f) setError("Please choose a video file.");
  }, []);

  const onSubmit = useCallback(async () => {
    if (!file) {
      setError("Select a video first.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const { assetId } = await uploadFile(file);
      navigate(`/analysis/${assetId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }, [file, navigate]);

  return (
    <div className="page upload-page">
      <div className="page-content">
      <div className="logo">Play<span>Sight</span> AI</div>
      <h1 className="headline">Pro-level game analysis. From your phone.</h1>
      <p className="tagline">
        Upload game footage and get AI-powered highlights, heatmaps, and coaching insights in minutes.
      </p>

      <div
        className={`dropzone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          type="file"
          accept="video/*"
          onChange={onFileChange}
          className="file-input"
          id="file-input"
        />
        <label htmlFor="file-input" className="dropzone-label">
          {file ? (
            <span className="file-name">{file.name}</span>
          ) : (
            <>
              <span className="dropzone-icon"><VideoIcon /></span>
              <span>Drag & drop a video here, or click to browse</span>
            </>
          )}
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      <button
        type="button"
        className="btn primary"
        onClick={onSubmit}
        disabled={!file || uploading}
      >
        {uploading ? "Uploading…" : "Upload & Analyze"}
      </button>

      <p className="demo-hint">
        <Link to="/analysis/demo">View demo results</Link> without uploading
      </p>
      </div>

      <Footer />
    </div>
  );
}
