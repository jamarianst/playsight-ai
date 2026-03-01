/**
 * Shared types for PlaySight AI pipeline
 */

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type EventType = 'goal' | 'shot' | 'key_pass' | 'recovery' | 'other';

export interface KeyMoment {
  timestamp: number; // seconds
  type: EventType;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessingResult {
  jobId: string;
  status: JobStatus;
  highlightVideoUrl?: string;
  heatmapImageUrl?: string;
  keyMoments: KeyMoment[];
  error?: string;
}

export interface TrackFrame {
  frameIndex: number;
  timestamp: number;
  tracks: Array<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    confidence?: number;
  }>;
  ball?: { x: number; y: number; confidence?: number };
}
