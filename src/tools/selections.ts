import { ToolDefinition } from './shared.js';
import { PhotoCraftConnection } from '../photocraft/connection.js';
import { safeRun, pcSuccess, pcError, normalizeDocState } from './shared.js';

export function createPhotoCraftSelectionTools(pc: PhotoCraftConnection): ToolDefinition[] {
  return [
    {
      tool: {
        name: 'photocraft_select_all',
        description: 'Select the entire canvas.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('select.all', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'All selected.');
        }),
    },

    {
      tool: {
        name: 'photocraft_deselect',
        description: 'Remove the current selection.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('select.deselect', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Deselected.');
        }),
    },

    {
      tool: {
        name: 'photocraft_invert_selection',
        description: 'Invert the current selection.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('select.inverse', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Selection inverted.');
        }),
    },

    {
      tool: {
        name: 'photocraft_select_rect',
        description: 'Create a rectangular selection.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            left: { type: 'number', description: 'Left edge in pixels' },
            top: { type: 'number', description: 'Top edge in pixels' },
            right: { type: 'number', description: 'Right edge in pixels' },
            bottom: { type: 'number', description: 'Bottom edge in pixels' },
          },
          required: ['left', 'top', 'right', 'bottom'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const left = args.left as number;
          const top = args.top as number;
          const width = (args.right as number) - left;
          const height = (args.bottom as number) - top;
          if (!(width > 0 && height > 0)) {
            return pcError('right must be greater than left and bottom greater than top', 'invalid_param');
          }
          // The engine takes origin + size, not edges.
          const result = await pc.runCommand('select.rect', { x: left, y: top, width, height });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Rectangular selection created.');
        }),
    },

    {
      tool: {
        name: 'photocraft_select_subject',
        description: 'Select the main subject of the image automatically.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('select.subject', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Subject selected.');
        }),
    },

    {
      tool: {
        name: 'photocraft_select_sky',
        description: 'Select the sky in the image automatically.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('select.sky', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Sky selected.');
        }),
    },

    {
      tool: {
        name: 'photocraft_feather_selection',
        description: 'Feather (soften the edge of) the active selection.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            radius: { type: 'number', description: 'Feather radius in pixels', minimum: 0, default: 5 },
          },
          required: ['radius'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('select.modify.feather', {
            featherRadius: (args.radius as number) ?? 5,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Selection feathered.');
        }),
    },

    {
      tool: {
        name: 'photocraft_expand_selection',
        description: 'Expand the selection by a given number of pixels.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            pixels: { type: 'number', description: 'Pixels to expand', minimum: 1, default: 5 },
          },
          required: ['pixels'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('select.modify.expand', {
            expandBy: (args.pixels as number) ?? 5,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Selection expanded.');
        }),
    },

    {
      tool: {
        name: 'photocraft_contract_selection',
        description: 'Contract the selection by a given number of pixels.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            pixels: { type: 'number', description: 'Pixels to contract', minimum: 1, default: 5 },
          },
          required: ['pixels'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('select.modify.contract', {
            contractBy: (args.pixels as number) ?? 5,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Selection contracted.');
        }),
    },

    {
      tool: {
        name: 'photocraft_color_range_selection',
        description: 'Select by color range.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            fuzziness: { type: 'number', description: 'Fuzziness 0–200', minimum: 0, maximum: 200, default: 40 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('select.colorRange', {
            fuzziness: (args.fuzziness as number) ?? 40,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Color range selected.');
        }),
    },
  ];
}
