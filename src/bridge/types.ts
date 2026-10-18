/**
 * FilmCraft Engine Command & Protocol Types
 */

export interface FilmCraftRequest {
  id?: number | string;
  method: string;
  params?: Record<string, unknown>;
}

export interface FilmCraftResponse<T = unknown> {
  id?: number | string;
  ok?: boolean;
  result?: T;
  error?: string;
}

export interface NleClient {
  executeCommand<T = unknown>(command: string, params?: Record<string, unknown>): Promise<T>;
  inspect<T = unknown>(target?: string, params?: Record<string, unknown>): Promise<T>;
  captureScreenshot?(path?: string): Promise<string>;
}

export interface TimelineClip {
  id: number;
  name: string;
  track: string;
  startTime: number; // in ticks or seconds
  duration: number;
  sourceIn: number;
  sourceOut: number;
  speed: number;
}

export interface TimelineTrack {
  id: string;
  name: string;
  kind: "video" | "audio";
  index: number;
  locked: boolean;
  muted?: boolean;
  solo?: boolean;
  clips: TimelineClip[];
}

export interface ProjectOverview {
  name: string;
  path?: string;
  activeSequence?: string;
  sequenceDuration?: number;
  fps?: number;
  tracks: {
    video: number;
    audio: number;
  };
  totalClips: number;
}

export interface EditReceipt {
  command: string;
  timestamp: string;
  undoId?: number;
  status: "success" | "dry_run" | "error";
  details: Record<string, unknown>;
  summary: string;
}
