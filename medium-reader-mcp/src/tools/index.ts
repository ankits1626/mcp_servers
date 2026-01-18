/**
 * Tools module - exports all tool registration functions
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPingTool } from "./ping.tool.js";
import { registerEchoTool } from "./echo.tool.js";
import { registerFetchUrlTool } from "./fetch-url.tool.js";
import { registerReadMediumTool } from "./read-medium.tool.js";

/**
 * Register all tools with the MCP server
 *
 * @param server - MCP server instance
 */
export function registerAllTools(server: McpServer): void {
  registerPingTool(server);
  registerEchoTool(server);
  registerFetchUrlTool(server);
  registerReadMediumTool(server);
}

// Also export individual tool registration functions
export { registerPingTool } from "./ping.tool.js";
export { registerEchoTool } from "./echo.tool.js";
export { registerFetchUrlTool } from "./fetch-url.tool.js";
export { registerReadMediumTool } from "./read-medium.tool.js";
