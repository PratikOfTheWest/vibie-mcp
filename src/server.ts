import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FilmCraftClient } from "./bridge/client.js";
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
  host?: string;
  port?: number;
  pack?: ToolPackName;
}

export function createVibieServer(config: ServerConfig = {}): {
  server: McpServer;
  client: FilmCraftClient;
} {
  const host = config.host || process.env.FILMCRAFT_HOST || "127.0.0.1";
  const port = config.port || Number(process.env.FILMCRAFT_PORT) || 9876;
  const pack = config.pack || (process.env.VIBIE_PACK as ToolPackName) || "full";

  const client = new FilmCraftClient(host, port);

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
  registerInspectionTools(server, client, pack);
  registerProjectTools(server, client, pack);
  registerTimelineTools(server, client, pack);
  registerAudioTools(server, client, pack);
  registerColorTools(server, client, pack);
  registerVisionTools(server, client, pack);
  registerGraphicsTools(server, client, pack);
  registerExportTools(server, client, pack);

  // Register live context resources
  registerLiveResources(server, client);

  // Register guided workflow prompts
  registerWorkflowPrompts(server);

  return { server, client };
}
