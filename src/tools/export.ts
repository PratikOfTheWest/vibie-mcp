import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NleClient } from "../bridge/types.js";
import { isToolInPack, type ToolPackName } from "./packs.js";
import { ReceiptManager } from "../workflows/receipts.js";

export function registerExportTools(
  server: McpServer,
  client: NleClient,
  activePack: ToolPackName = "full"
): void {
  if (isToolInPack("filmcraft_export_sequence", activePack)) {
    server.tool(
      "filmcraft_export_sequence",
      "Renders and exports the active FilmCraft sequence to video using hardware or software encoders.",
      {
        outputPath: z.string().describe("Target file destination (e.g. 'C:/Renders/FinalCut.mp4')"),
        preset: z.enum(["h264_youtube", "prores_422", "dnxhr_hq", "hevc_main10"]).default("h264_youtube").describe("Export preset format"),
        hardwareAcceleration: z.boolean().default(true).describe("Use GPU hardware encoder (NVENC on Windows/NVIDIA, VideoToolbox on macOS)"),
        exportRange: z.enum(["entireSequence", "inToOut"]).default("entireSequence").describe("Render range"),
      },
      async ({ outputPath, preset, hardwareAcceleration, exportRange }) => {
        try {
          const result = await client.executeCommand("export.start", {
            path: outputPath,
            preset,
            hardware: hardwareAcceleration,
            range: exportRange,
          });

          const receipt = ReceiptManager.createReceipt(
            "export.start",
            { outputPath, preset, hardwareAcceleration, exportRange, result },
            `Triggered export of sequence to '${outputPath}' using preset '${preset}'`
          );

          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error starting export: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_export_markers", activePack)) {
    server.tool(
      "filmcraft_export_markers",
      "Exports sequence review markers and timestamped editorial notes to a CSV document.",
      {
        csvOutputPath: z.string().describe("Destination file path for the exported markers CSV"),
      },
      async ({ csvOutputPath }) => {
        try {
          const result = await client.executeCommand("marker.exportCsv", {
            path: csvOutputPath,
          });

          const receipt = ReceiptManager.createReceipt(
            "marker.exportCsv",
            { csvOutputPath, result },
            `Exported timeline markers to '${csvOutputPath}'`
          );

          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error exporting markers: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }
}
