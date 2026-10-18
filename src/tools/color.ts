import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NleClient } from "../bridge/types.js";
import { isToolInPack, type ToolPackName } from "./packs.js";
import { ReceiptManager } from "../workflows/receipts.js";

export function registerColorTools(
  server: McpServer,
  client: NleClient,
  activePack: ToolPackName = "full"
): void {
  if (isToolInPack("filmcraft_lumetri_grade", activePack)) {
    server.tool(
      "filmcraft_lumetri_grade",
      "Adjusts Lumetri color grade parameters (exposure, contrast, temperature, highlights, shadows, curves) on a timeline clip.",
      {
        clipId: z.number().describe("Timeline clip ID to color grade"),
        exposure: z.number().optional().describe("Exposure EV adjustment (-5.0 to +5.0)"),
        contrast: z.number().optional().describe("Contrast adjustment (-100 to +100)"),
        temperature: z.number().optional().describe("White balance temperature (-100 cool to +100 warm)"),
        tint: z.number().optional().describe("White balance tint (-100 green to +100 magenta)"),
        highlights: z.number().optional().describe("Highlights recovery (-100 to +100)"),
        shadows: z.number().optional().describe("Shadows recovery (-100 to +100)"),
        saturation: z.number().optional().describe("Color saturation (0 to 200, 100 = neutral)"),
      },
      async ({ clipId, ...params }) => {
        try {
          const appliedParams: Record<string, number> = {};
          for (const [key, val] of Object.entries(params)) {
            if (val !== undefined) {
              appliedParams[key] = val;
              await client.executeCommand("effects.setParam", {
                clip: clipId,
                effect: "lumetri",
                param: key,
                value: val,
              });
            }
          }

          const receipt = ReceiptManager.createReceipt(
            "effects.setParam:lumetri",
            { clipId, appliedParams },
            `Applied Lumetri color grade to clip #${clipId}`
          );
          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error applying Lumetri grade: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_lumetri_match", activePack)) {
    server.tool(
      "filmcraft_lumetri_match",
      "Auto-matches color grade of a target clip against a reference frame/clip timecode with face detection awareness.",
      {
        clipId: z.number().describe("Target clip ID to receive matching grade"),
        referenceTimecode: z.string().describe("Reference timecode to match against (e.g. '00:01:24:12')"),
        faceDetection: z.boolean().default(true).describe("Prioritize matching human skin tones"),
      },
      async ({ clipId, referenceTimecode, faceDetection }) => {
        try {
          const result = await client.executeCommand("lumetri.applyMatch", {
            clip: clipId,
            referenceTimecode,
            faceDetection,
          });
          const receipt = ReceiptManager.createReceipt(
            "lumetri.applyMatch",
            { clipId, referenceTimecode, faceDetection, result },
            `Color matched clip #${clipId} to reference at ${referenceTimecode}`
          );
          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error matching color grade: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }
}
