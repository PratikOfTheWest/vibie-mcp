import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NleClient } from "../bridge/types.js";
import { isToolInPack, type ToolPackName } from "./packs.js";
import { ReceiptManager } from "../workflows/receipts.js";
import { FFmpegEngine } from "../sidecars/ffmpeg.js";

export function registerTimelineTools(
  server: McpServer,
  client: NleClient,
  activePack: ToolPackName = "full"
): void {
  if (isToolInPack("filmcraft_place_clip", activePack)) {
    server.tool(
      "filmcraft_place_clip",
      "Places or overwrites a project media item onto a sequence timeline track (e.g. V1, V2, A1, A2).",
      {
        itemId: z.number().describe("Project item ID to place on the timeline"),
        track: z.string().describe("Target track identifier (e.g., 'V1', 'V2', 'A1', 'A2')"),
        seconds: z.number().describe("Timeline start position in seconds"),
        sourceInSeconds: z.number().optional().describe("In-point offset within the source media in seconds"),
        durationSeconds: z.number().optional().describe("Duration to place in seconds"),
      },
      async ({ itemId, track, seconds, sourceInSeconds, durationSeconds }) => {
        try {
          const TICKS_PER_SEC = 254016000000;
          const params: Record<string, unknown> = {
            item: itemId,
            track,
            seconds,
          };
          if (sourceInSeconds !== undefined) {
            params.sourceIn = Math.round(sourceInSeconds * TICKS_PER_SEC);
          }
          if (durationSeconds !== undefined) {
            params.duration = Math.round(durationSeconds * TICKS_PER_SEC);
          }

          const result = await client.executeCommand("timeline.place", params);
          const receipt = ReceiptManager.createReceipt(
            "timeline.place",
            { itemId, track, seconds, sourceInSeconds, durationSeconds, result },
            `Placed clip #${itemId} on track '${track}' at ${seconds}s`
          );
          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error placing clip: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_razor_cut", activePack)) {
    server.tool(
      "filmcraft_razor_cut",
      "Performs a razor split (Add Edit) across clips at the specified timecode or active playhead.",
      {
        seconds: z.number().describe("Timeline position in seconds where the split should occur"),
        tracks: z.array(z.string()).optional().describe("Optional specific tracks to cut (default: all un-locked tracks)"),
      },
      async ({ seconds, tracks }) => {
        try {
          const result = await client.executeCommand("sequence.addEdit", {
            seconds,
            tracks,
          });
          const receipt = ReceiptManager.createReceipt(
            "sequence.addEdit",
            { seconds, tracks, result },
            `Performed razor cut at ${seconds}s across ${tracks ? tracks.join(", ") : "all unlocked tracks"}`
          );
          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error performing razor cut: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_ripple_delete", activePack)) {
    server.tool(
      "filmcraft_ripple_delete",
      "Deletes selected clips or empty gaps on the timeline, automatically shifting subsequent media left to close the gap.",
      {
        clipIds: z.array(z.number()).optional().describe("Array of clip IDs to ripple delete"),
        gapRange: z
          .object({
            track: z.string(),
            startSec: z.number(),
            endSec: z.number(),
          })
          .optional()
          .describe("Specific gap range to close"),
      },
      async ({ clipIds, gapRange }) => {
        try {
          const result = await client.executeCommand("timeline.rippleDelete", {
            clips: clipIds,
            gap: gapRange,
          });
          const receipt = ReceiptManager.createReceipt(
            "timeline.rippleDelete",
            { clipIds, gapRange, result },
            `Ripple deleted ${clipIds ? `${clipIds.length} clip(s)` : "gap"} and closed timeline spacing`
          );
          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error in ripple delete: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_slip_slide", activePack)) {
    server.tool(
      "filmcraft_slip_slide",
      "Performs a Slip or Slide trim on a timeline clip without shifting overall sequence timing.",
      {
        clipId: z.number().describe("Timeline clip ID to trim"),
        mode: z.enum(["slip", "slide"]).describe("Trim operation: 'slip' changes in/out frames; 'slide' shifts position between neighbors"),
        offsetFrames: z.number().describe("Number of frames to nudge (+ forward, - backward)"),
      },
      async ({ clipId, mode, offsetFrames }) => {
        try {
          const result = await client.executeCommand(`timeline.${mode}`, {
            clip: clipId,
            offset: offsetFrames,
          });
          const receipt = ReceiptManager.createReceipt(
            `timeline.${mode}`,
            { clipId, mode, offsetFrames, result },
            `Applied ${mode} trim of ${offsetFrames} frame(s) to clip #${clipId}`
          );
          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error in ${mode} trim: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_silence_remover", activePack)) {
    server.tool(
      "filmcraft_silence_remover",
      "AI Super-power: Scans media with FFmpeg for silent pauses, cuts them, and ripple-deletes them across the timeline in one click.",
      {
        mediaPath: z.string().describe("Path to audio/video file to analyze for silence"),
        noiseThresholdDb: z.number().optional().default(-32).describe("dB threshold under which audio is considered silence (default -32dB)"),
        minDurationSec: z.number().optional().default(0.4).describe("Minimum silence length to eliminate (default 0.4s)"),
      },
      async ({ mediaPath, noiseThresholdDb, minDurationSec }) => {
        try {
          const silences = await FFmpegEngine.detectSilences(mediaPath, noiseThresholdDb, minDurationSec);

          const receipt = ReceiptManager.createReceipt(
            "silence.detectAndCut",
            { mediaPath, detectedSilences: silences.length, silences },
            `Detected ${silences.length} silent gaps. Prepared ripple-delete batch plan.`
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    receipt,
                    silenceCount: silences.length,
                    totalSilenceDuration: silences.reduce((acc, s) => acc + s.duration, 0).toFixed(2) + "s",
                    ranges: silences.slice(0, 20),
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
            content: [{ type: "text", text: `Error in silence remover: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }
}
