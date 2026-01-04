/**
 * Tools module - exports all tool registration functions
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPingTool } from "./ping.tool.js";

/**
 * Register all tools with the MCP server
 *
 * @param server - MCP server instance
 */
export function registerAllTools(server: McpServer): void {
  registerPingTool(server);
}

// Also export individual tool registration functions
export { registerPingTool } from "./ping.tool.js";
