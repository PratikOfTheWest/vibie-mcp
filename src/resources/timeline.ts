import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NleClient } from "../bridge/types.js";

export function registerLiveResources(server: McpServer, client: NleClient): void {
  // Live Timeline Resource
  server.resource(
    "filmcraft_timeline_active",
    "filmcraft://timeline/active",
    async (uri) => {
      try {
        const state = await client.inspect("activeSequence");
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(
                {
                  status: "online",
                  timeline: state,
                },
                null,
                2
              ),
              mimeType: "application/json",
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(
                {
                  status: "offline",
                  error: msg,
                  note: "Start FilmCraft with 'filmcraft --control 9876' or start Adobe Premiere Pro to stream live timeline data",
                },
                null,
                2
              ),
              mimeType: "application/json",
            },
          ],
        };
      }
    }
  );

  // Live Project Overview Resource
  server.resource(
    "filmcraft_project_overview",
    "filmcraft://project/overview",
    async (uri) => {
      try {
        const overview = (await client.inspect("project")) as any;
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(
                {
                  status: "online",
                  projectName: overview?.name || overview?.projectName || "Active Project",
                  activeSequence: overview?.activeSequence,
                  root: overview?.root,
                  raw: overview,
                },
                null,
                2
              ),
              mimeType: "application/json",
            },
          ],
        };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(
                {
                  status: "offline",
                  error: msg,
                  note: "Start FilmCraft with 'filmcraft --control 9876' or start Adobe Premiere Pro to stream live project data",
                },
                null,
                2
              ),
              mimeType: "application/json",
            },
          ],
        };
      }
    }
  );
}
