import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NleClient } from "../bridge/types.js";
import { isToolInPack, type ToolPackName } from "./packs.js";
import { ReceiptManager } from "../workflows/receipts.js";
import { FFmpegEngine } from "../sidecars/ffmpeg.js";

export function registerAudioTools(
  server: McpServer,
  client: NleClient,
  activePack: ToolPackName = "full"
): void {
  if (isToolInPack("filmcraft_audio_gain", activePack)) {
    server.tool(
      "filmcraft_audio_gain",
      "Adjusts the audio volume gain of selected audio clips in decibels (dB).",
      {
        clipIds: z.array(z.number()).describe("Audio clip IDs to adjust"),
        mode: z.enum(["set", "adjust", "normalizeMax", "normalizeAll"]).describe("Gain operation mode"),
        db: z.number().describe("Decibels value (e.g. +3.0 to boost, -6.0 to reduce, or target peak dB)"),
      },
      async ({ clipIds, mode, db }) => {
        try {
          const result = await client.executeCommand("clip.audioGain", {
            clips: clipIds,
            mode,
            db,
          });
          const receipt = ReceiptManager.createReceipt(
            "clip.audioGain",
            { clipIds, mode, db, result },
            `Adjusted audio gain on ${clipIds.length} clip(s) by ${db}dB (mode: ${mode})`
          );
          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error adjusting audio gain: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_essential_sound_ducking", activePack)) {
    server.tool(
      "filmcraft_essential_sound_ducking",
      "Automatically ducks background music audio underneath dialogue tracks with smooth fades.",
      {
        musicClipIds: z.array(z.number()).describe("Clip IDs of the background music bed"),
        duckingAgainst: z.enum(["dialogue", "sfx", "ambience"]).default("dialogue").describe("Audio type that triggers ducking"),
        reduceDb: z.number().default(-18).describe("Reduction amount in dB (e.g., -18dB)"),
        fadeDurationSec: z.number().default(0.8).describe("Fade in/out curve duration in seconds"),
      },
      async ({ musicClipIds, duckingAgainst, reduceDb, fadeDurationSec }) => {
        try {
          const result = await client.executeCommand("essentialSound.set", {
            clips: musicClipIds,
            values: {
              "ducking.against": duckingAgainst,
              "ducking.reduceDb": reduceDb,
              "ducking.fadeS": fadeDurationSec,
              "ducking.enabled": true,
            },
          });

          await client.executeCommand("essentialSound.generateDucking", {
            clips: musicClipIds,
          });

          const receipt = ReceiptManager.createReceipt(
            "essentialSound.ducking",
            { musicClipIds, duckingAgainst, reduceDb, fadeDurationSec, result },
            `Generated auto-ducking on ${musicClipIds.length} music clip(s) by ${reduceDb}dB against ${duckingAgainst}`
          );
          return {
            content: [{ type: "text", text: JSON.stringify(receipt, null, 2) }],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [{ type: "text", text: `Error generating audio ducking: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }

  if (isToolInPack("filmcraft_measure_loudness", activePack)) {
    server.tool(
      "filmcraft_measure_loudness",
      "Measures EBU R128 integrated loudness, True Peak, and Loudness Range (LRA) using FFmpeg.",
      {
        audioOrVideoPath: z.string().describe("Path to media file or rendered sequence audio"),
        targetLufs: z.number().optional().default(-14).describe("Target platform LUFS (e.g., -14 for YouTube/Spotify, -24 for Broadcast)"),
      },
      async ({ audioOrVideoPath, targetLufs }) => {
        try {
          const report = await FFmpegEngine.measureLoudness(audioOrVideoPath, targetLufs);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    mediaPath: audioOrVideoPath,
                    targetLufs,
                    measurements: report,
                    recommendedAction: `Apply ${report.gainAdjustmentDb > 0 ? "+" : ""}${report.gainAdjustmentDb}dB gain adjustment to match ${targetLufs} LUFS broadcast standard.`,
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
            content: [{ type: "text", text: `Error measuring loudness: ${msg}` }],
            isError: true,
          };
        }
      }
    );
  }
}
