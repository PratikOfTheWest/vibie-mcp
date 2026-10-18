#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createVibieServer } from "./server.js";

async function main(): Promise<void> {
  const { server } = createVibieServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("Vibie FilmCraft MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error starting Vibie MCP server:", err);
  process.exit(1);
});
