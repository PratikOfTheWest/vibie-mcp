import * as http from "node:http";

export class PremiereClient {
  private host: string;
  private port: number;

  constructor(host = "127.0.0.1", port = 9877) {
    this.host = host;
    this.port = port;
  }

  public async ping(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.get(`http://${this.host}:${this.port}/ping`, { timeout: 1500 }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  public async executeCommand<T = unknown>(
    command: string,
    params: Record<string, unknown> = {},
    timeoutMs = 15000
  ): Promise<T> {
    const payload = JSON.stringify({ command, params });

    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: this.host,
          port: this.port,
          path: "/execute",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
          timeout: timeoutMs,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.ok) {
                resolve(parsed.result as T);
              } else {
                reject(new Error(parsed.error || "Premiere execution failed"));
              }
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              reject(new Error(`Failed to parse Premiere response: ${msg}`));
            }
          });
        }
      );

      req.on("error", (err) => reject(new Error(`Premiere Bridge connection error: ${err.message}`)));
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Timeout waiting for Premiere Pro response"));
      });

      req.write(payload);
      req.end();
    });
  }

  public async inspect<T = unknown>(target = "activeSequence"): Promise<T> {
    if (target === "project" || target === "projectPanel") {
      return this.executeCommand<T>("project.inspect", {});
    }
    return this.executeCommand<T>("sequence.inspect", { target });
  }
}
