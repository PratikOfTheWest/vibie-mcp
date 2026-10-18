export type ToolPackName =
  | "essential"
  | "editorial"
  | "audio"
  | "color"
  | "vision"
  | "export"
  | "full";

export const PACK_TOOLS: Record<ToolPackName, string[]> = {
  essential: [
    "filmcraft_inspect_timeline",
    "filmcraft_inspect_project",
    "filmcraft_place_clip",
    "filmcraft_razor_cut",
    "filmcraft_ripple_delete",
    "filmcraft_capture_frame",
  ],
  editorial: [
    "filmcraft_inspect_timeline",
    "filmcraft_inspect_project",
    "filmcraft_import_media",
    "filmcraft_create_bin",
    "filmcraft_place_clip",
    "filmcraft_razor_cut",
    "filmcraft_ripple_delete",
    "filmcraft_slip_slide",
    "filmcraft_silence_remover",
    "filmcraft_add_marker",
    "filmcraft_capture_frame",
  ],
  audio: [
    "filmcraft_inspect_timeline",
    "filmcraft_audio_normalize",
    "filmcraft_audio_gain",
    "filmcraft_essential_sound_ducking",
    "filmcraft_measure_loudness",
  ],
  color: [
    "filmcraft_inspect_timeline",
    "filmcraft_lumetri_grade",
    "filmcraft_lumetri_match",
    "filmcraft_capture_frame",
  ],
  vision: [
    "filmcraft_inspect_timeline",
    "filmcraft_object_select_mask",
    "filmcraft_auto_reframe_vertical",
    "filmcraft_capture_frame",
  ],
  export: [
    "filmcraft_inspect_timeline",
    "filmcraft_export_sequence",
    "filmcraft_export_markers",
  ],
  full: [
    "filmcraft_inspect_timeline",
    "filmcraft_inspect_project",
    "filmcraft_import_media",
    "filmcraft_create_bin",
    "filmcraft_place_clip",
    "filmcraft_razor_cut",
    "filmcraft_ripple_delete",
    "filmcraft_slip_slide",
    "filmcraft_silence_remover",
    "filmcraft_audio_normalize",
    "filmcraft_audio_gain",
    "filmcraft_essential_sound_ducking",
    "filmcraft_measure_loudness",
    "filmcraft_lumetri_grade",
    "filmcraft_lumetri_match",
    "filmcraft_object_select_mask",
    "filmcraft_auto_reframe_vertical",
    "filmcraft_generate_lower_third",
    "filmcraft_generate_title_card",
    "filmcraft_add_marker",
    "filmcraft_export_sequence",
    "filmcraft_export_markers",
    "filmcraft_capture_frame",
  ],
};

export function isToolInPack(toolName: string, activePack: ToolPackName = "full"): boolean {
  if (activePack === "full") return true;
  const tools = PACK_TOOLS[activePack];
  return tools ? tools.includes(toolName) : true;
}
