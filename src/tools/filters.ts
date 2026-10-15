import { ToolDefinition } from './shared.js';
import { PhotoCraftConnection } from '../photocraft/connection.js';
import { safeRun, pcSuccess, normalizeDocState } from './shared.js';

export function createPhotoCraftFilterTools(pc: PhotoCraftConnection): ToolDefinition[] {
  return [
    {
      tool: {
        name: 'photocraft_gaussian_blur',
        description: 'Apply Gaussian Blur to the active layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            radius: { type: 'number', description: 'Blur radius in pixels (0.1–250)', minimum: 0.1, maximum: 250, default: 5 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('filter.blur.gaussianBlur', {
            radius: (args.radius as number) ?? 5,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Gaussian blur applied.');
        }),
    },

    {
      tool: {
        name: 'photocraft_unsharp_mask',
        description: 'Apply Unsharp Mask to the active layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: '1–500', minimum: 1, maximum: 500, default: 100 },
            radius: { type: 'number', description: '0.1–250 pixels', minimum: 0.1, maximum: 250, default: 1 },
            threshold: { type: 'number', description: '0–255 levels', minimum: 0, maximum: 255, default: 0 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('filter.sharpen.unsharpMask', {
            amount: (args.amount as number) ?? 100,
            radius: (args.radius as number) ?? 1,
            threshold: (args.threshold as number) ?? 0,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Unsharp mask applied.');
        }),
    },

    {
      tool: {
        name: 'photocraft_smart_sharpen',
        description: 'Apply Smart Sharpen to the active layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: '1–500', minimum: 1, maximum: 500, default: 100 },
            radius: { type: 'number', description: '0.1–64 pixels', minimum: 0.1, maximum: 64, default: 1 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('filter.sharpen.smartSharpen', {
            amount: (args.amount as number) ?? 100,
            radius: (args.radius as number) ?? 1,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Smart sharpen applied.');
        }),
    },

    {
      tool: {
        name: 'photocraft_surface_blur',
        description: 'Apply Surface Blur to the active layer (skin smoothing).\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            radius: { type: 'number', description: '1–100 pixels', minimum: 1, maximum: 100, default: 5 },
            threshold: { type: 'number', description: '2–255 levels', minimum: 2, maximum: 255, default: 15 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('filter.blur.surfaceBlur', {
            radius: (args.radius as number) ?? 5,
            threshold: (args.threshold as number) ?? 15,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Surface blur applied.');
        }),
    },

    {
      tool: {
        name: 'photocraft_motion_blur',
        description: 'Apply Motion Blur to the active layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            angle: { type: 'number', description: 'Angle -360 to 360 degrees', minimum: -360, maximum: 360, default: 0 },
            distance: { type: 'number', description: '1–999 pixels', minimum: 1, maximum: 999, default: 10 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('filter.blur.motionBlur', {
            angle: (args.angle as number) ?? 0,
            distance: (args.distance as number) ?? 10,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Motion blur applied.');
        }),
    },

    {
      tool: {
        name: 'photocraft_noise_add',
        description: 'Add noise to the active layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            amount: { type: 'number', description: '0.1–400 %', minimum: 0.1, maximum: 400, default: 10 },
            distribution: { type: 'string', enum: ['uniform', 'gaussian'], default: 'gaussian' },
            monochromatic: { type: 'boolean', default: false },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('filter.noise.addNoise', {
            amount: (args.amount as number) ?? 10,
            distribution: (args.distribution as string) ?? 'gaussian',
            monochromatic: (args.monochromatic as boolean) ?? false,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Noise added.');
        }),
    },

    {
      tool: {
        name: 'photocraft_high_pass',
        description: 'Apply High Pass filter to the active layer.\n\nReturns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            radius: { type: 'number', description: '0.1–1000 pixels', minimum: 0.1, maximum: 1000, default: 10 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('filter.other.highPass', {
            radius: (args.radius as number) ?? 10,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'High pass applied.');
        }),
    },
  ];
}
