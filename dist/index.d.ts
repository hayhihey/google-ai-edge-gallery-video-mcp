#!/usr/bin/env node
/**
 * Google AI Edge Gallery Video MCP Server
 * Model Context Protocol (MCP) server for on-device and edge video creation.
 * Supports Stdio and HTTP/SSE transports.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ToolDefinitions } from './tools/tool-definitions.js';
export declare function createServerInstance(): {
    server: Server;
    tools: ToolDefinitions;
};
