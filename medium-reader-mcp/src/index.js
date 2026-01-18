#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fetchMediumArticle } from "./fetcher.js";

// Initialize the MCP Server (The Brain)
const server = new Server(
  { name: "medium-reader-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } },
);

// Pillar 3: The Server (The Translator) - Listing the tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "read_medium_article",
      description:
        "Fetch and read a Medium article. Bypasses paywalls and 403 errors.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Medium article URL" },
          format: {
            type: "string",
            enum: ["markdown", "text", "html"],
            default: "markdown",
          },
        },
        required: ["url"],
      },
    },
  ],
}));

// Pillar 3: The Server (The Translator) - Handling the actual call
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "read_medium_article") {
    const { url, format } = request.params.arguments;

    try {
      // Calling Pillar 2: The Fetcher (The Muscle)
      const content = await fetchMediumArticle(url, format);
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// "Plug in" to the transport (The Power Socket)
const transport = new StdioServerTransport();
await server.connect(transport);
