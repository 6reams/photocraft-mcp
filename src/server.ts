import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from './logger.js';
import { PhotoCraftConnection } from './photocraft/connection.js';
import { ToolDefinition, pcError } from './tools/shared.js';
import { createPhotoCraftStateTools } from './tools/state.js';
import { createPhotoCraftDocumentTools } from './tools/documents.js';
import { createPhotoCraftLayerTools } from './tools/layers.js';
import { createPhotoCraftAdjustmentTools } from './tools/adjustments.js';
import { createPhotoCraftFilterTools } from './tools/filters.js';
import { createPhotoCraftSelectionTools } from './tools/selections.js';
import { createPhotoCraftExportTools } from './tools/export.js';

export const VERSION = '1.0.0';

const INSTRUCTIONS =
  'You are connected to PhotoCraft via the photocraft-mcp server. ' +
  'Use the available tools to open, edit, and export images. ' +
  'Call photocraft_ping first to confirm the engine is ready. ' +
  'For operations not covered by a dedicated tool, use photocraft_execute_script ' +
  'with any command id from photocraft_get_capabilities.';

export async function runServer(): Promise<void> {
  const logger = new Logger('server');
  const connection = new PhotoCraftConnection();

  const info = await connection.detect();
  if (!info) {
    logger.error('PhotoCraft CLI not found. Install PhotoCraft or set PHOTOCRAFT_PATH.');
    process.exit(1);
  }
  logger.info(`PhotoCraft detected at ${info.cliPath}`);

  const tools = new Map<string, ToolDefinition>();
  for (const def of [
    ...createPhotoCraftStateTools(connection),
    ...createPhotoCraftDocumentTools(connection),
    ...createPhotoCraftLayerTools(connection),
    ...createPhotoCraftAdjustmentTools(connection),
    ...createPhotoCraftFilterTools(connection),
    ...createPhotoCraftSelectionTools(connection),
    ...createPhotoCraftExportTools(connection),
  ]) {
    tools.set(def.tool.name, def);
  }

  const server = new Server(
    { name: 'photocraft-mcp', version: VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCTIONS }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...tools.values()].map((def) => def.tool),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const def = tools.get(name);
    if (!def) return pcError(`Unknown tool: ${name}`, 'unknown_tool');
    try {
      logger.debug(`call ${name}`);
      return await def.handler(args ?? {});
    } catch (err) {
      logger.error(`Tool "${name}" threw:`, err);
      return pcError(err instanceof Error ? err.message : String(err));
    }
  });

  await server.connect(new StdioServerTransport());
  logger.info(`PhotoCraft MCP server running with ${tools.size} tools`);
}
