import { ToolDefinition } from './shared.js';
import { PhotoCraftConnection } from '../photocraft/connection.js';
import { pcSuccess, pcError, safeRun, normalizeDocState } from './shared.js';

export function createPhotoCraftDocumentTools(pc: PhotoCraftConnection): ToolDefinition[] {
  return [
    {
      tool: {
        name: 'photocraft_create_document',
        description:
          'Create a new PhotoCraft document with specified dimensions and color mode.\n\n' +
          'Returns: document info JSON.\n' +
          'Preconditions: none. Side effects: creates and activates a new document.',
        inputSchema: {
          type: 'object',
          properties: {
            width: { type: 'number', description: 'Width in pixels (default 1920)', default: 1920, minimum: 1 },
            height: { type: 'number', description: 'Height in pixels (default 1080)', default: 1080, minimum: 1 },
            resolution: { type: 'number', description: 'Resolution in DPI (default 72)', default: 72 },
            colorMode: {
              type: 'string',
              description: 'Color mode',
              enum: ['RGB', 'CMYK', 'Grayscale'],
              default: 'RGB',
            },
            name: { type: 'string', description: 'Document name' },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const modeMap: Record<string, string> = { RGB: 'rgb', CMYK: 'cmyk', Grayscale: 'gray' };
          const result = await pc.docNew({
            width: (args.width as number) ?? 1920,
            height: (args.height as number) ?? 1080,
            resolution: (args.resolution as number) ?? 72,
            mode: modeMap[(args.colorMode as string) ?? 'RGB'] ?? 'rgb',
            name: args.name as string | undefined,
            background: 'white',
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Document created.');
        }),
    },

    {
      tool: {
        name: 'photocraft_open_image',
        description:
          'Open an image file (.pcraft, .psd, .png, .jpg, .tif, .webp, .exr, …) as a new document.\n\n' +
          'Returns: document info JSON.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Absolute path to the image file' },
          },
          required: ['path'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (!args.path) return pcError('path is required', 'missing_param');
          const result = await pc.docOpen(args.path as string);
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, `Opened: ${args.path}`);
        }),
    },

    {
      tool: {
        name: 'photocraft_get_document_info',
        description:
          'Read the active document size, mode, depth, and layer tree.\n\n' +
          'Returns: document JSON.\n' +
          'Preconditions: an open document. Side effects: none.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.docInspect();
          return pcSuccess({ ok: true, ...normalizeDocState(result) });
        }),
    },

    {
      tool: {
        name: 'photocraft_list_documents',
        description:
          'List every open document with id, dimensions, and which one is active.\n\n' +
          'Returns: session list JSON.\n' +
          'Side effects: none.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.sessionList();
          return pcSuccess({ ok: true, ...(typeof result === 'object' && result ? result : { data: result }) });
        }),
    },

    {
      tool: {
        name: 'photocraft_set_active_document',
        description:
          'Switch the active document by numeric id.\n\n' +
          'Returns: confirmation JSON.\n' +
          'Preconditions: target document must be open.',
        inputSchema: {
          type: 'object',
          properties: {
            document_id: { type: 'number', description: 'Document id from photocraft_list_documents' },
          },
          required: ['document_id'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (args.document_id == null) return pcError('document_id is required', 'missing_param');
          const result = await pc.docSelect(args.document_id as number);
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, `Activated document ${args.document_id}.`);
        }),
    },

    {
      tool: {
        name: 'photocraft_save_document',
        description:
          'Save the active document. Saves in-place when no path is given.\n\n' +
          'Returns: { ok, path }.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Output file path (optional; saves in-place if omitted)' },
            format: {
              type: 'string',
              description: 'Output format extension (pcraft, psd, png, jpg, tif, webp)',
              enum: ['pcraft', 'psd', 'png', 'jpg', 'tif', 'webp'],
            },
            quality: { type: 'number', description: 'JPEG / WebP quality 1-100', minimum: 1, maximum: 100 },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.docSave({
            path: args.path as string | undefined,
            format: args.format as string | undefined,
            quality: args.quality as number | undefined,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Document saved.');
        }),
    },

    {
      tool: {
        name: 'photocraft_close_document',
        description:
          'Close the active document.\n\n' +
          'Returns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            save: { type: 'boolean', description: 'Save before closing (default false)', default: false },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.docClose({ save: (args.save as boolean) ?? false });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Document closed.');
        }),
    },

    {
      tool: {
        name: 'photocraft_resize_image',
        description:
          'Resize the active document canvas (image size).\n\n' +
          'Returns: { ok, width, height }.',
        inputSchema: {
          type: 'object',
          properties: {
            width: { type: 'number', description: 'New width in pixels', minimum: 1 },
            height: { type: 'number', description: 'New height in pixels', minimum: 1 },
            resample: {
              type: 'string',
              description: 'Resample algorithm',
              enum: ['bicubic', 'bilinear', 'nearestNeighbor', 'none'],
              default: 'bicubic',
            },
          },
          required: ['width', 'height'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (!args.width || !args.height) return pcError('width and height are required', 'missing_param');
          const result = await pc.runCommand('image.imageSize', {
            width: args.width,
            height: args.height,
            resampleMethod: args.resample ?? 'bicubic',
            scaleStyles: true,
            constrain: false,
          });
          return pcSuccess({ ok: true, width: args.width, height: args.height, ...normalizeDocState(result) });
        }),
    },

    {
      tool: {
        name: 'photocraft_crop_document',
        description:
          'Crop the active document to the given rectangle.\n\n' +
          'Returns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            left: { type: 'number', description: 'Left edge in pixels', minimum: 0 },
            top: { type: 'number', description: 'Top edge in pixels', minimum: 0 },
            right: { type: 'number', description: 'Right edge in pixels', minimum: 1 },
            bottom: { type: 'number', description: 'Bottom edge in pixels', minimum: 1 },
          },
          required: ['left', 'top', 'right', 'bottom'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('image.crop', {
            left: args.left,
            top: args.top,
            right: args.right,
            bottom: args.bottom,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Document cropped.');
        }),
    },

    {
      tool: {
        name: 'photocraft_canvas_size',
        description:
          'Change the canvas size without resampling pixels.\n\n' +
          'Returns: { ok }.',
        inputSchema: {
          type: 'object',
          properties: {
            width: { type: 'number', description: 'New canvas width in pixels', minimum: 1 },
            height: { type: 'number', description: 'New canvas height in pixels', minimum: 1 },
            anchor: {
              type: 'string',
              description: 'Anchor point',
              enum: ['topLeft', 'topCenter', 'topRight', 'middleLeft', 'middleCenter', 'middleRight', 'bottomLeft', 'bottomCenter', 'bottomRight'],
              default: 'middleCenter',
            },
          },
          required: ['width', 'height'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('image.canvasSize', {
            width: args.width,
            height: args.height,
            anchor: args.anchor ?? 'middleCenter',
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Canvas resized.');
        }),
    },

    {
      tool: {
        name: 'photocraft_duplicate_document',
        description: 'Duplicate the active document.\n\nReturns: new document info.',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name for the duplicate (optional)' },
          },
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          const result = await pc.runCommand('image.duplicate', {
            name: args.name ?? undefined,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Document duplicated.');
        }),
    },

    {
      tool: {
        name: 'photocraft_revert_document',
        description: 'Revert the active document to its last saved state.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('file.revert', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Document reverted.');
        }),
    },
  ];
}
