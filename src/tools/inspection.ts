import { z } from "zod";
import * as fs from "node:fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FilmCraftClient } from "../bridge/client.js";
import { isToolInPack, type ToolPackName } from "./packs.js";

export function registerInspectionTools(
  server: McpServer,
  client: FilmCraftClient,
  activePack: ToolPackName = "full"
): void {
  if (isToolInPack("filmcraft_inspect_timeline", activePack)) {
    server.tool(
      "filmcraft_inspect_timeline",
      "Inspects the active sequence on the FilmCraft timeline, returning track structures, placed clips, durations, and playhead position.",
      {},
      async () => {
        try {
          const overview = await client.inspect("activeSequence");
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(overview, null, 2),
              },
            ],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "fallback",
                    message: `Could not reach live FilmCraft instance on 127.0.0.1:9876: ${msg}`,
                    sampleTimelineState: {
                      sequenceName: "Main Timeline",
                      fps: 24,
                      tracks: {
                        V1: [{ id: 1, name: "A-Roll_01.mp4", duration: 12.5 }],
                        V2: [{ id: 2, name: "B-Roll_Cutaway.mp4", duration: 4.0 }],
                        A1: [{ id: 3, name: "Dialogue_Mic.wav", duration: 12.5 }],
                        A2: [{ id: 4, name: "Music_Bed.mp3", duration: 30.0 }],
                      },
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_capture_frame", activePack)) {
    server.tool(
      "filmcraft_capture_frame",
      "Captures the current rendered frame from the FilmCraft Program Monitor for AI vision models to inspect visually.",
      {
        outputFileName: z.string().default("program_frame.png").describe("Local image file name to save the frame to"),
      },
      async ({ outputFileName }) => {
        try {
          const savedPath = await client.captureScreenshot(outputFileName);
          let base64Image = "";
          if (fs.existsSync(savedPath)) {
            base64Image = fs.readFileSync(savedPath).toString("base64");
          }

          return {
            content: [
              {
                type: "text",
                text: `Captured Program monitor frame saved to '${savedPath}'`,
              },
              ...(base64Image
                ? [
                    {
                      type: "image" as const,
                      data: base64Image,
                      mimeType: "image/png",
                    },
                  ]
                : []),
            ],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error capturing frame: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_add_marker", activePack)) {
    server.tool(
      "filmcraft_add_marker",
      "Adds a colored editorial or review marker at a specific timecode with notes.",
      {
        seconds: z.number().describe("Timeline position in seconds"),
        name: z.string().describe("Marker title (e.g. 'Cut to B-Roll here', 'Audio pop')"),
        color: z.enum(["green", "red", "purple", "orange", "cyan"]).default("green").describe("Marker color badge"),
        comment: z.string().optional().describe("Detailed editorial feedback or instruction"),
      },
      async ({ seconds, name, color, comment }) => {
        try {
          const result = await client.executeCommand("marker.add", {
            seconds,
            name,
            color,
            comment,
          });

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "success",
                    marker: { seconds, name, color, comment, result },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error adding marker: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }
}
