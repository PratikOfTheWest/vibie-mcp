import * as net from "node:net";
import { exec } from "node:child_process";
import type { FilmCraftRequest, FilmCraftResponse } from "./types.js";

export async function checkFilmCraftProcessRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const cmd =
      process.platform === "win32"
        ? 'tasklist /FI "IMAGENAME eq filmcraft.exe"'
        : "pgrep -x filmcraft";
    exec(cmd, (err, stdout) => {
      if (err) return resolve(false);
      resolve(stdout.toLowerCase().includes("filmcraft"));
    });
  });
}

/**
 * Robust JSON-Lines TCP Bridge to FilmCraft (127.0.0.1:9876)
 * Handles socket framing, timeouts, and auto-reconnection.
 */
export class FilmCraftClient {
  private socket: net.Socket | null = null;
  private host: string;
  private port: number;
  private buffer = "";
  private pendingRequests = new Map<
    number | string,
    {
      resolve: (res: FilmCraftResponse) => void;
      reject: (err: Error) => void;
      timer: NodeJS.Timeout;
    }
  >();
  private nextId = 1;
  private isConnecting = false;

  constructor(host = "127.0.0.1", port = 9876) {
    this.host = host;
    this.port = port;
  }

  public async connect(): Promise<void> {
    if (this.socket && !this.socket.destroyed) {
      return;
    }

    if (this.isConnecting) {
      return new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (this.socket && !this.socket.destroyed) {
            clearInterval(check);
            resolve();
          }
        }, 50);
        setTimeout(() => {
          clearInterval(check);
          reject(new Error("Connection timeout waiting for socket"));
        }, 5000);
      });
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      const sock = new net.Socket();

      sock.on("connect", () => {
        this.socket = sock;
        this.isConnecting = false;
        resolve();
      });

      sock.on("data", (data) => {
        this.onData(data);
      });

      sock.on("error", (err) => {
        this.isConnecting = false;
        // Clean up any pending requests on socket error
        for (const [id, req] of this.pendingRequests.entries()) {
          clearTimeout(req.timer);
          req.reject(new Error(`Socket error: ${err.message}`));
          this.pendingRequests.delete(id);
        }
        reject(err);
      });

      sock.on("close", () => {
        this.socket = null;
        this.isConnecting = false;
      });

      sock.connect(this.port, this.host);
    });
  }

  private onData(chunk: Buffer): void {
    this.buffer += chunk.toString("utf8");
    const lines = this.buffer.split("\n");
    // The last element is either empty or incomplete JSON line
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed) as FilmCraftResponse;
        if (parsed.id !== undefined && this.pendingRequests.has(parsed.id)) {
          const { resolve, timer } = this.pendingRequests.get(parsed.id)!;
          clearTimeout(timer);
          this.pendingRequests.delete(parsed.id);
          resolve(parsed);
        }
      } catch (err) {
        console.error("Failed to parse response JSON from FilmCraft:", trimmed, err);
      }
    }
  }

  public async executeCommand<T = unknown>(
    command: string,
    params: Record<string, unknown> = {},
    timeoutMs = 15000
  ): Promise<T> {
    return this.sendRequest<T>("engine.execute", { command, params }, timeoutMs);
  }

  public async getDiagnosticMessage(): Promise<string> {
    const running = await checkFilmCraftProcessRunning();
    if (running) {
      return "⚠️ FilmCraft is OPEN, but was started without AI Control Mode. Please close FilmCraft and relaunch it using 'launch-control.bat' (or run: filmcraft --control 9876) so AI agents can control it.";
    }
    return "FilmCraft is not running. Please launch it using 'launch-control.bat' or run: filmcraft --control 9876.";
  }

  public async inspect<T = unknown>(
    target = "activeSequence",
    params: Record<string, unknown> = {},
    timeoutMs = 10000
  ): Promise<T> {
    if (target === "project" || target === "projectPanel") {
      return this.sendRequest<T>("engine.execute", { command: "project.inspect", params: {} }, timeoutMs);
    }

    if (target === "ui" || target === "window") {
      return this.sendRequest<T>("ui.inspect", {}, timeoutMs);
    }

    try {
      const sequenceData = await this.sendRequest<any>("engine.execute", { command: "sequence.inspect", params }, timeoutMs);
      try {
        const uiData = await this.sendRequest<any>("ui.inspect", {}, 3000);
        return {
          ...sequenceData,
          fps: uiData.fps,
          playhead: uiData.playhead,
          playback: uiData.playback,
        } as T;
      } catch {
        return sequenceData as T;
      }
    } catch {
      return this.sendRequest<T>("ui.inspect", {}, timeoutMs);
    }
  }

  public async captureScreenshot(path = "program_frame.png", timeoutMs = 10000): Promise<string> {
    const res = await this.sendRequest<{ path: string }>("ui.screenshot", { path }, timeoutMs);
    return res.path || path;
  }

  public async sendRequest<T = unknown>(
    method: string,
    params?: Record<string, unknown>,
    timeoutMs = 15000
  ): Promise<T> {
    try {
      await this.connect();
    } catch {
      const diag = await this.getDiagnosticMessage();
      throw new Error(diag);
    }

    if (!this.socket || this.socket.destroyed) {
      const diag = await this.getDiagnosticMessage();
      throw new Error(diag);
    }

    const id = this.nextId++;
    const req: FilmCraftRequest = { id, method, params };
    const payload = JSON.stringify(req) + "\n";

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Timeout waiting for FilmCraft response for method '${method}'`));
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (response: FilmCraftResponse) => {
          if (response.ok === false || response.error) {
            reject(new Error(response.error || "FilmCraft command returned error"));
          } else {
            resolve(response.result as T);
          }
        },
        reject,
        timer,
      });

      this.socket!.write(payload, "utf8");
    });
  }

  public isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed;
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }
}
