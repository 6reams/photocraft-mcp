import { ToolDefinition } from './shared.js';
import { PhotoCraftConnection } from '../photocraft/connection.js';
import { safeRun, pcSuccess, normalizeDocState } from './shared.js';

export function createPhotoCraftAdjustmentTools(pc: PhotoCraftConnection): ToolDefinition[] {
  return [
    {
      tool: {
        name: 'photocraft_adjustment_brightness_contrast',
        description: 'Add a Brightness/Contrast adjustment layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            brightness: { type: 'number', description: '-150 to 150', minimum: -150, maximum: 150, default: 0 },
            contrast: { type: 'number', description: '-50 to 100', minimum: -50, maximum: 100, default: 0 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.newAdjustmentLayer.brightnessContrast', {
            brightness: (args.brightness as number) ?? 0,
            contrast: (args.contrast as number) ?? 0,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Brightness/Contrast adjustment added.');
        }),
    },

    {
      tool: {
        name: 'photocraft_adjustment_hue_saturation',
        description: 'Add a Hue/Saturation adjustment layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            hue: { type: 'number', description: '-180 to 180', minimum: -180, maximum: 180, default: 0 },
            saturation: { type: 'number', description: '-100 to 100', minimum: -100, maximum: 100, default: 0 },
            lightness: { type: 'number', description: '-100 to 100', minimum: -100, maximum: 100, default: 0 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.newAdjustmentLayer.hueSaturation', {
            hue: (args.hue as number) ?? 0,
            saturation: (args.saturation as number) ?? 0,
            lightness: (args.lightness as number) ?? 0,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Hue/Saturation adjustment added.');
        }),
    },

    {
      tool: {
        name: 'photocraft_adjustment_curves',
        description: 'Add a Curves adjustment layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            preset: {
              type: 'string',
              description: 'Named preset to apply (optional)',
              enum: ['auto_tone', 'neutral', 'lighten', 'darken', 'increase_contrast', 'decrease_contrast', 'custom'],
            },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.newAdjustmentLayer.curves', {
            preset: args.preset ?? undefined,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Curves adjustment added.');
        }),
    },

    {
      tool: {
        name: 'photocraft_adjustment_levels',
        description: 'Add a Levels adjustment layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            inputBlack: { type: 'number', description: '0–253', minimum: 0, maximum: 253, default: 0 },
            inputWhite: { type: 'number', description: '2–255', minimum: 2, maximum: 255, default: 255 },
            gamma: { type: 'number', description: '0.01–9.99', minimum: 0.01, maximum: 9.99, default: 1.0 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.newAdjustmentLayer.levels', {
            inputBlack: args.inputBlack ?? 0,
            inputWhite: args.inputWhite ?? 255,
            gamma: args.gamma ?? 1.0,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Levels adjustment added.');
        }),
    },

    {
      tool: {
        name: 'photocraft_adjustment_vibrance',
        description: 'Add a Vibrance adjustment layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            vibrance: { type: 'number', description: '-100 to 100', minimum: -100, maximum: 100, default: 0 },
            saturation: { type: 'number', description: '-100 to 100', minimum: -100, maximum: 100, default: 0 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.newAdjustmentLayer.vibrance', {
            vibrance: (args.vibrance as number) ?? 0,
            saturation: (args.saturation as number) ?? 0,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Vibrance adjustment added.');
        }),
    },

    {
      tool: {
        name: 'photocraft_desaturate',
        description: 'Desaturate the active layer (convert to grayscale values in place).\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('image.adjustments.desaturate', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Layer desaturated.');
        }),
    },

    {
      tool: {
        name: 'photocraft_invert',
        description: 'Invert the colors of the active layer.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('image.adjustments.invert', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Layer inverted.');
        }),
    },

    {
      tool: {
        name: 'photocraft_auto_tone',
        description: 'Apply Auto Tone to the active document.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('image.autoTone', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Auto tone applied.');
        }),
    },

    {
      tool: {
        name: 'photocraft_auto_color',
        description: 'Apply Auto Color to the active document.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('image.autoColor', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Auto color applied.');
        }),
    },

    {
      tool: {
        name: 'photocraft_auto_contrast',
        description: 'Apply Auto Contrast to the active document.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('image.autoContrast', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Auto contrast applied.');
        }),
    },
  ];
}
