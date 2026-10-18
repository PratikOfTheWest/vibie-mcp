import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerWorkflowPrompts(server: McpServer): void {
  server.prompt(
    "vibie_rough_cut",
    "Assemble a fast rough cut from raw footage by cutting out silences and placing selects on the timeline.",
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please act as my Lead Video Editor. 
1. Use 'filmcraft_inspect_timeline' to check what media is currently available.
2. Run 'filmcraft_silence_remover' to strip awkward pauses and dead air from the main dialogue.
3. Ripple delete the empty spaces to make the pacing brisk.
4. Auto-normalize dialogue audio with 'filmcraft_audio_gain' or 'filmcraft_measure_loudness' to -14 LUFS.
5. Capture a frame with 'filmcraft_capture_frame' to verify the result visually.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "vibie_podcast_shorts_generator",
    "Turn horizontal 16:9 podcast video into 9:16 vertical viral shorts with auto-reframe and animated captions.",
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Transform the active timeline clip into a vertical viral short (9:16 format):
1. Apply 'filmcraft_auto_reframe_vertical' to dynamically track the speaker's face and keep them centered.
2. Generate an animated modern lower third or title card with 'filmcraft_generate_lower_third' on track V2.
3. Duck background music under the speaker's voice using 'filmcraft_essential_sound_ducking'.
4. Export the resulting clip using 'filmcraft_export_sequence' for YouTube Shorts/TikTok.`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "vibie_ai_object_mask",
    "Isolate and mask a person, car, or subject in the shot using OpenCV/SAM-powered AI Object Selection.",
    async () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please isolate the main subject in the active clip:
1. Call 'filmcraft_capture_frame' to visually inspect the frame.
2. Use 'filmcraft_object_select_mask' targeting the subject description (e.g. 'person in foreground').
3. Inspect the applied mask points and adjust feathering if necessary.`,
            },
          },
        ],
      };
    }
  );
}
