import { FilmCraftClient } from "./client.js";
import { PremiereClient } from "./premiere-client.js";

export type NleHost = "filmcraft" | "premiere" | "auto";

export interface HostStatus {
  filmcraft: boolean;
  premiere: boolean;
  activeTarget: "filmcraft" | "premiere" | "none";
}

/**
 * Unified NLE Bridge
 * Seamlessly routes commands to either FilmCraft (127.0.0.1:9876)
 * or Adobe Premiere Pro (127.0.0.1:9877) based on availability.
 */
export class UnifiedBridge {
  private filmcraftClient: FilmCraftClient;
  private premiereClient: PremiereClient;
  private preferredTarget: NleHost = "auto";

  constructor(
    filmcraftHost = "127.0.0.1",
    filmcraftPort = 9876,
    premiereHost = "127.0.0.1",
    premierePort = 9877
  ) {
    this.filmcraftClient = new FilmCraftClient(filmcraftHost, filmcraftPort);
    this.premiereClient = new PremiereClient(premiereHost, premierePort);
  }

  public setPreferredTarget(target: NleHost): void {
    this.preferredTarget = target;
  }

  public async detectHosts(): Promise<HostStatus> {
    let filmcraftOnline = false;
    let premiereOnline = false;

    try {
      await this.filmcraftClient.connect();
      filmcraftOnline = this.filmcraftClient.isConnected();
    } catch {
      filmcraftOnline = false;
    }

    try {
      premiereOnline = await this.premiereClient.ping();
    } catch {
      premiereOnline = false;
    }

    let activeTarget: "filmcraft" | "premiere" | "none" = "none";
    if (this.preferredTarget === "filmcraft" && filmcraftOnline) {
      activeTarget = "filmcraft";
    } else if (this.preferredTarget === "premiere" && premiereOnline) {
      activeTarget = "premiere";
    } else if (filmcraftOnline) {
      activeTarget = "filmcraft";
    } else if (premiereOnline) {
      activeTarget = "premiere";
    }

    return {
      filmcraft: filmcraftOnline,
      premiere: premiereOnline,
      activeTarget,
    };
  }

  public lastExecutedHost: "filmcraft" | "premiere" | "none" = "none";

  public async executeCommand<T = unknown>(
    command: string,
    params: Record<string, unknown> = {}
  ): Promise<T> {
    const status = await this.detectHosts();

    if (status.activeTarget === "filmcraft") {
      this.lastExecutedHost = "filmcraft";
      return this.filmcraftClient.executeCommand<T>(command, params);
    }

    if (status.activeTarget === "premiere") {
      this.lastExecutedHost = "premiere";
      return this.premiereClient.executeCommand<T>(command, params);
    }

    throw new Error(
      "No video editor connected. Please start FilmCraft ('filmcraft --control 9876') or launch Adobe Premiere Pro with the Vibie Bridge extension."
    );
  }

  public async inspect<T = unknown>(target = "activeSequence"): Promise<T> {
    const status = await this.detectHosts();

    if (status.activeTarget === "filmcraft") {
      this.lastExecutedHost = "filmcraft";
      return this.filmcraftClient.inspect<T>(target);
    }

    if (status.activeTarget === "premiere") {
      this.lastExecutedHost = "premiere";
      return this.premiereClient.inspect<T>(target);
    }

    throw new Error("Cannot inspect timeline: neither FilmCraft nor Premiere Pro bridge is active.");
  }

  public async captureScreenshot(path = "program_frame.png"): Promise<string> {
    const status = await this.detectHosts();
    if (status.activeTarget === "filmcraft") {
      return this.filmcraftClient.captureScreenshot(path);
    }
    // Return path fallback for Premiere Pro
    return path;
  }
}
