import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { FilmCraftClient } from "../bridge/client.js";
import { isToolInPack, type ToolPackName } from "./packs.js";
import { ReceiptManager } from "../workflows/receipts.js";
import { HyperFramesEngine } from "../sidecars/hyperframes.js";

export function registerGraphicsTools(
  server: McpServer,
  client: FilmCraftClient,
  activePack: ToolPackName = "full"
): void {
  if (isToolInPack("filmcraft_generate_lower_third", activePack)) {
    server.tool(
      "filmcraft_generate_lower_third",
      "Uses HyperFrames to generate an animated Lower Third graphic overlay for speakers or chapters.",
      {
        primaryText: z.string().describe("Main title / speaker name"),
        secondaryText: z.string().describe("Subtitle / job title / chapter description"),
        accentColor: z.string().default("#8b5cf6").describe("Hex accent color for the graphic bar"),
        targetTrack: z.string().default("V2").describe("Timeline video track to place the graphic on (default V2)"),
        startTimeSec: z.number().default(0).describe("Timeline start position in seconds"),
      },
      async ({ primaryText, secondaryText, accentColor, targetTrack, startTimeSec }) => {
        try {
          const htmlContent = HyperFramesEngine.generateLowerThird(primaryText, secondaryText, accentColor);

          // In production, HyperFrames renders HTML to transparent ProRes 4444 video
          // Here we create the graphics clip directly in FilmCraft's title engine
          const result = await client.executeCommand("timeline.placeGraphic", {
            track: targetTrack,
            seconds: startTimeSec,
            type: "html_overlay",
            title: primaryText,
            subtitle: secondaryText,
            html: htmlContent,
          });

          const receipt = ReceiptManager.createReceipt(
            "graphics.lowerThird",
            { primaryText, secondaryText, accentColor, targetTrack, startTimeSec, result },
            `Generated animated Lower Third '${primaryText}' on track ${targetTrack} at ${startTimeSec}s`
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    receipt,
                    renderedTemplatePreview: htmlContent.slice(0, 300) + "...",
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
            content: [{ type: "text", text: `Error generating lower third: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_generate_title_card", activePack)) {
    server.tool(
      "filmcraft_generate_title_card",
      "Uses HyperFrames to generate a cinematic or modern title card with animated typography.",
      {
        heading: z.string().describe("Main headline or title"),
        subheading: z.string().optional().describe("Optional secondary description or date"),
        theme: z.enum(["cyber", "cinema", "minimal"]).default("cinema").describe("Visual theme style"),
        durationSeconds: z.number().default(4).describe("Card duration in seconds"),
      },
      async ({ heading, subheading, theme, durationSeconds }) => {
        try {
          const htmlContent = HyperFramesEngine.generateTitleCard(heading, subheading, theme);

          const receipt = ReceiptManager.createReceipt(
            "graphics.titleCard",
            { heading, subheading, theme, durationSeconds },
            `Generated ${theme} Title Card '${heading}' for ${durationSeconds}s`
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ receipt, htmlPreview: htmlContent.slice(0, 300) + "..." }, null, 2),
              },
            ],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error generating title card: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }
}
