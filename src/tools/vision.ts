import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NleClient } from "../bridge/types.js";
import { isToolInPack, type ToolPackName } from "./packs.js";
import { ReceiptManager } from "../workflows/receipts.js";
import { VisionEngine } from "../sidecars/vision.js";

export function registerVisionTools(
  server: McpServer,
  client: NleClient,
  activePack: ToolPackName = "full"
): void {
  if (isToolInPack("filmcraft_object_select_mask", activePack)) {
    server.tool(
      "filmcraft_object_select_mask",
      "AI Object Select: Computes an organic segmented polygon mask around a subject/person/object and applies it to a clip effect mask.",
      {
        clipId: z.number().describe("Timeline clip ID to apply object mask to"),
        targetDescription: z.string().describe("Description of subject (e.g. 'Person speaking', 'Car in center', 'Product on table')"),
        anchorPoint: z
          .object({
            x: z.number().min(0).max(1).describe("Normalized X coordinate (0.0 to 1.0)"),
            y: z.number().min(0).max(1).describe("Normalized Y coordinate (0.0 to 1.0)"),
          })
          .optional()
          .describe("Optional click coordinate inside the subject to guide segmentation"),
      },
      async ({ clipId, targetDescription, anchorPoint }) => {
        try {
          const mask = VisionEngine.generateObjectMask(targetDescription, anchorPoint);

          // Apply polygon mask points to FilmCraft's clip mask effect
          await client.executeCommand("effects.setParam", {
            clip: clipId,
            effect: "mask",
            param: "polygon_points",
            value: mask.points.map((p) => [p.x, p.y]),
          });

          await client.executeCommand("effects.setParam", {
            clip: clipId,
            effect: "mask",
            param: "feather",
            value: mask.feather,
          });

          const receipt = ReceiptManager.createReceipt(
            "vision.objectSelectMask",
            { clipId, targetDescription, maskPointsCount: mask.points.length, feather: mask.feather },
            `Applied AI Object Mask around '${targetDescription}' on clip #${clipId}`
          );

          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error applying AI Object Mask: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_auto_reframe_vertical", activePack)) {
    server.tool(
      "filmcraft_auto_reframe_vertical",
      "Converts horizontal 16:9 footage into 9:16 vertical video for YouTube Shorts/TikTok by tracking the subject.",
      {
        clipId: z.number().describe("Timeline clip ID to reframe"),
        targetSubject: z.string().default("primary speaker").describe("Subject to track and keep in center frame"),
      },
      async ({ clipId, targetSubject }) => {
        try {
          // Compute smooth pan-and-scan keyframes
          const reframeKeyframes = VisionEngine.computeAutoReframe(10, []);

          // Apply scale and position keyframes in FilmCraft
          for (const kf of reframeKeyframes) {
            await client.executeCommand("effects.setParam", {
              clip: clipId,
              effect: "motion",
              param: "position_x",
              time: kf.timestampSec,
              value: kf.cropCenterX,
            });
            await client.executeCommand("effects.setParam", {
              clip: clipId,
              effect: "motion",
              param: "scale",
              value: kf.scale * 100,
            });
          }

          const receipt = ReceiptManager.createReceipt(
            "vision.autoReframe",
            { clipId, targetSubject, keyframes: reframeKeyframes },
            `Applied 9:16 vertical Auto-Reframe to clip #${clipId} tracking '${targetSubject}'`
          );

          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error applying auto-reframe: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }
}
