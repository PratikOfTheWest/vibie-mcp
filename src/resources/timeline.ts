import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FilmCraftClient } from "../bridge/client.js";

export function registerLiveResources(server: McpServer, client: FilmCraftClient): void {
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
              text: JSON.stringify(state, null, 2),
              mimeType: "application/json",
            },
          ],
        };
      } catch {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(
                {
                  status: "offline",
                  note: "FilmCraft desktop control server not connected on 127.0.0.1:9876",
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
        const overview = await client.inspect("project");
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(overview, null, 2),
              mimeType: "application/json",
            },
          ],
        };
      } catch {
        return {
          contents: [
            {
              uri: uri.href,
              text: JSON.stringify(
                {
                  status: "offline",
                  note: "Start FilmCraft with 'filmcraft --control 9876' to stream live project data",
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
