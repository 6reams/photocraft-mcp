import { ToolDefinition } from './shared.js';
import { PhotoCraftConnection } from '../photocraft/connection.js';
import { pcSuccess, safeRun, normalizeDocState } from './shared.js';

export function createPhotoCraftStateTools(pc: PhotoCraftConnection): ToolDefinition[] {
  return [
    {
      tool: {
        name: 'photocraft_ping',
        description:
          'Check whether PhotoCraft is reachable and the headless engine is ready.\n\n' +
          'Returns: { ok, engine: "photocraft" }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          await pc.ensureReady();
          return pcSuccess({ ok: true, engine: 'photocraft', message: 'PhotoCraft is ready.' });
        }),
    },

    {
      tool: {
        name: 'photocraft_get_state',
        description:
          'Get the full current state: session, open documents, and active document layer tree.\n\n' +
          'Returns: { ok, session, documents, activeDocument }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const [session, doc] = await Promise.allSettled([
            pc.sessionList(),
            pc.docInspect(),
          ]);
          return pcSuccess({
            ok: true,
            engine: 'photocraft',
            session: session.status === 'fulfilled' ? session.value : null,
            activeDocument: doc.status === 'fulfilled' ? normalizeDocState(doc.value) : null,
          });
        }),
    },

    {
      tool: {
        name: 'photocraft_get_capabilities',
        description: 'Get PhotoCraft engine capabilities and available commands.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.client.call('engine.commands', {});
          return pcSuccess({ ok: true, engine: 'photocraft', commands: result });
        }),
    },

    {
      tool: {
        name: 'photocraft_undo',
        description: 'Undo the last action.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('edit.undo', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Undone.');
        }),
    },

    {
      tool: {
        name: 'photocraft_redo',
        description: 'Redo the previously undone action.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('edit.redo', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Redone.');
        }),
    },

    {
      tool: {
        name: 'photocraft_execute_script',
        description:
          'Execute a raw PhotoCraft engine command by id with optional JSON params.\n\n' +
          'Use this for any PhotoCraft command not covered by a dedicated tool.\n' +
          'Returns: raw command result.',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Engine command id (see photocraft_get_capabilities for the full list)',
            },
            params: {
              type: 'object',
              description: 'Command parameters as a JSON object (optional)',
            },
            timeout_ms: {
              type: 'number',
              description: 'Execution timeout in milliseconds (default 30000)',
            },
          },
          required: ['command'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand(
            args.command as string,
            args.params ?? {},
            args.timeout_ms as number | undefined
          );
          return pcSuccess({ ok: true, result });
        }),
    },
  ];
}
