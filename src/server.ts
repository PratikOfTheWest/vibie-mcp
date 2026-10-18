import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { UnifiedBridge, type NleHost } from "./bridge/unified-bridge.js";
import { type ToolPackName } from "./tools/packs.js";
import { registerProjectTools } from "./tools/project.js";
import { registerTimelineTools } from "./tools/timeline.js";
import { registerAudioTools } from "./tools/audio.js";
import { registerColorTools } from "./tools/color.js";
import { registerVisionTools } from "./tools/vision.js";
import { registerGraphicsTools } from "./tools/graphics.js";
import { registerExportTools } from "./tools/export.js";
import { registerInspectionTools } from "./tools/inspection.js";
import { registerLiveResources } from "./resources/timeline.js";
import { registerWorkflowPrompts } from "./workflows/prompts.js";

export interface ServerConfig {
  filmcraftHost?: string;
  filmcraftPort?: number;
  premiereHost?: string;
  premierePort?: number;
  target?: NleHost;
  pack?: ToolPackName;
}

export function createVibieServer(config: ServerConfig = {}): {
  server: McpServer;
  bridge: UnifiedBridge;
} {
  const fcHost = config.filmcraftHost || process.env.FILMCRAFT_HOST || "127.0.0.1";
  const fcPort = config.filmcraftPort || Number(process.env.FILMCRAFT_PORT) || 9876;
  const pproHost = config.premiereHost || process.env.PREMIERE_HOST || "127.0.0.1";
  const pproPort = config.premierePort || Number(process.env.PREMIERE_PORT) || 9877;
  const pack = config.pack || (process.env.VIBIE_PACK as ToolPackName) || "full";
  const target = config.target || (process.env.VIBIE_TARGET as NleHost) || "auto";

  const bridge = new UnifiedBridge(fcHost, fcPort, pproHost, pproPort);
  bridge.setPreferredTarget(target);

  const server = new McpServer(
    {
      name: "vibie-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Register all modular domain tools
  registerInspectionTools(server, bridge, pack);
  registerProjectTools(server, bridge, pack);
  registerTimelineTools(server, bridge, pack);
  registerAudioTools(server, bridge, pack);
  registerColorTools(server, bridge, pack);
  registerVisionTools(server, bridge, pack);
  registerGraphicsTools(server, bridge, pack);
  registerExportTools(server, bridge, pack);

  // Register live context resources
  registerLiveResources(server, bridge);

  // Register guided workflow prompts
  registerWorkflowPrompts(server);

  return { server, bridge };
}
