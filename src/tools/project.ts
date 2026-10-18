import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FilmCraftClient } from "../bridge/client.js";
import { isToolInPack, type ToolPackName } from "./packs.js";
import { ReceiptManager } from "../workflows/receipts.js";

export function registerProjectTools(
  server: McpServer,
  client: FilmCraftClient,
  activePack: ToolPackName = "full"
): void {
  if (isToolInPack("filmcraft_import_media", activePack)) {
    server.tool(
      "filmcraft_import_media",
      "Imports audio, video, or graphic media files into the active FilmCraft project bin.",
      {
        filePaths: z.array(z.string()).describe("List of absolute file paths to import"),
        binName: z.string().optional().describe("Target bin name (e.g. 'A-Roll', 'B-Roll', 'Audio')"),
      },
      async ({ filePaths, binName }) => {
        try {
          const result = await client.executeCommand("project.import", {
            paths: filePaths,
            bin: binName,
          });
          const receipt = ReceiptManager.createReceipt(
            "project.import",
            { filePaths, binName, result },
            `Successfully imported ${filePaths.length} media file(s) into bin '${binName || "Root"}'`
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(receipt, null, 2),
              },
            ],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error importing media: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_create_bin", activePack)) {
    server.tool(
      "filmcraft_create_bin",
      "Creates a new organizational bin/folder in the FilmCraft project panel.",
      {
        name: z.string().describe("Name of the bin (e.g., 'Selects', 'SoundFX', 'Graphics')"),
        parentBinId: z.number().optional().describe("Optional parent bin ID for nested structure"),
      },
      async ({ name, parentBinId }) => {
        try {
          const result = await client.executeCommand("project.createBin", {
            name,
            parent: parentBinId,
          });
          const receipt = ReceiptManager.createReceipt(
            "project.createBin",
            { name, parentBinId, result },
            `Created project bin '${name}'`
          );
          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error creating bin: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }
}
