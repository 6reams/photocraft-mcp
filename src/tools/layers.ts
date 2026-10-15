import { ToolDefinition } from './shared.js';
import { PhotoCraftConnection } from '../photocraft/connection.js';
import { pcSuccess, pcError, safeRun, normalizeDocState } from './shared.js';

export function createPhotoCraftLayerTools(pc: PhotoCraftConnection): ToolDefinition[] {
  return [
    {
      tool: {
        name: 'photocraft_get_layers',
        description:
          'Get the full layer tree of the active document.\n\n' +
          'Returns: { ok, layers[] } with id, name, kind, visible, opacity, blendMode.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const doc = await pc.docInspect();
          return pcSuccess({ ok: true, ...normalizeDocState(doc) });
        }),
    },

    {
      tool: {
        name: 'photocraft_add_layer',
        description:
          'Add a new blank raster layer above the active layer.\n\n' +
          'Returns: { ok, layerName }.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Layer name' },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.new.layer', {
            name: args.name ?? undefined,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Layer added.');
        }),
    },

    {
      tool: {
        name: 'photocraft_delete_layer',
        description: 'Delete the active layer.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.delete', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Layer deleted.');
        }),
    },

    {
      tool: {
        name: 'photocraft_select_layer',
        description:
          'Select a layer by id.\n\n' +
          'Returns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            layer_id: { type: 'number', description: 'Layer id from photocraft_get_layers' },
          },
          required: ['layer_id'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (args.layer_id == null) return pcError('layer_id is required', 'missing_param');
          const result = await pc.runCommand('layer.select', { layer: args.layer_id as number });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, `Selected layer ${args.layer_id}.`);
        }),
    },

    {
      tool: {
        name: 'photocraft_rename_layer',
        description: 'Rename the active layer.\n\nReturns: { ok, name }.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'New layer name' },
          },
          required: ['name'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (!args.name) return pcError('name is required', 'missing_param');
          const result = await pc.runCommand('layer.renameLayer', { name: args.name as string });
          return pcSuccess({ ok: true, name: args.name, ...normalizeDocState(result) });
        }),
    },

    {
      tool: {
        name: 'photocraft_duplicate_layer',
        description: 'Duplicate the active layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name for the duplicate (optional)' },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.duplicate', {
            name: args.name ?? undefined,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Layer duplicated.');
        }),
    },

    {
      tool: {
        name: 'photocraft_set_layer_opacity',
        description: 'Set the opacity of the active layer (0–100).\n\nReturns: { ok, opacity }.',
        inputSchema: {
          type: 'object',
          properties: {
            opacity: { type: 'number', description: 'Opacity 0–100', minimum: 0, maximum: 100 },
          },
          required: ['opacity'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (args.opacity == null) return pcError('opacity is required', 'missing_param');
          const result = await pc.runCommand('layer.setProps', { opacity: args.opacity as number });
          return pcSuccess({ ok: true, opacity: args.opacity, ...normalizeDocState(result) });
        }),
    },

    {
      tool: {
        name: 'photocraft_set_layer_visibility',
        description: 'Show or hide the active layer.\n\nReturns: { ok, visible }.',
        inputSchema: {
          type: 'object',
          properties: {
            visible: { type: 'boolean', description: 'true to show, false to hide' },
          },
          required: ['visible'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (args.visible == null) return pcError('visible is required', 'missing_param');
          const cmd = (args.visible as boolean) ? 'layer.showLayers' : 'layer.hideLayers';
          const result = await pc.runCommand(cmd, {});
          return pcSuccess({ ok: true, visible: args.visible, ...normalizeDocState(result) });
        }),
    },

    {
      tool: {
        name: 'photocraft_set_layer_blend_mode',
        description:
          'Set the blend mode of the active layer.\n\n' +
          'Returns: { ok, blendMode }.',
        inputSchema: {
          type: 'object',
          properties: {
            blend_mode: {
              type: 'string',
              description:
                'Blend mode: normal, multiply, screen, overlay, darken, lighten, ' +
                'colorDodge, colorBurn, hardLight, softLight, difference, exclusion, ' +
                'hue, saturation, color, luminosity',
            },
          },
          required: ['blend_mode'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (!args.blend_mode) return pcError('blend_mode is required', 'missing_param');
          const result = await pc.runCommand('layer.setProps', { blendMode: args.blend_mode as string });
          return pcSuccess({ ok: true, blendMode: args.blend_mode, ...normalizeDocState(result) });
        }),
    },

    {
      tool: {
        name: 'photocraft_merge_visible',
        description: 'Merge all visible layers into one.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.mergeVisible', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Visible layers merged.');
        }),
    },

    {
      tool: {
        name: 'photocraft_flatten_image',
        description: 'Flatten all layers into the background.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.flattenImage', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Image flattened.');
        }),
    },

    {
      tool: {
        name: 'photocraft_group_layers',
        description: 'Group the selected layers.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Group name' },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.groupLayers', {
            name: args.name ?? undefined,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Layers grouped.');
        }),
    },

    {
      tool: {
        name: 'photocraft_rasterize_layer',
        description: 'Rasterize the active layer (smart object, text, shape, etc.).\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.rasterize.layer', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Layer rasterized.');
        }),
    },

    {
      tool: {
        name: 'photocraft_translate_layer',
        description: 'Move the active layer by a pixel offset.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'Horizontal offset in pixels' },
            y: { type: 'number', description: 'Vertical offset in pixels' },
          },
          required: ['x', 'y'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.translate', {
            x: args.x as number,
            y: args.y as number,
          });
          return pcSuccess({ ok: true, x: args.x, y: args.y, ...normalizeDocState(result) });
        }),
    },

    {
      tool: {
        name: 'photocraft_remove_background',
        description:
          'Remove the background from the active layer using PhotoCraft\'s subject isolation.\n\n' +
          'Returns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.removeBackground', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Background removed.');
        }),
    },

    {
      tool: {
        name: 'photocraft_add_layer_mask_from_selection',
        description: 'Create a layer mask that reveals the current selection.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.layerMask.revealSelection', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Layer mask created from selection.');
        }),
    },

    {
      tool: {
        name: 'photocraft_set_layer_locked',
        description: 'Lock or unlock the active layer.\n\nReturns: { ok, locked }.',
        inputSchema: {
          type: 'object',
          properties: {
            locked: { type: 'boolean', description: 'true to lock, false to unlock' },
          },
          required: ['locked'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (args.locked == null) return pcError('locked is required', 'missing_param');
          const result = await pc.runCommand('layer.lockLayers', {
            lock: {
              position: args.locked,
              pixels: args.locked,
              artboards: false,
            },
          });
          return pcSuccess({ ok: true, locked: args.locked, ...normalizeDocState(result) });
        }),
    },
  ];
}
