import { ToolDefinition } from './shared.js';
import { PhotoCraftConnection } from '../photocraft/connection.js';
import { safeRun, pcSuccess, pcError, normalizeDocState } from './shared.js';

export function createPhotoCraftExportTools(pc: PhotoCraftConnection): ToolDefinition[] {
  return [
    {
      tool: {
        name: 'photocraft_export_as',
        description:
          'Export the active document to a file in the specified format.\n\n' +
          'Supports: pcraft, psd, png, jpg, tif, webp, exr.\n' +
          'Returns: { ok, path }.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Output file path (absolute)' },
            format: {
              type: 'string',
              description: 'File format',
              enum: ['pcraft', 'psd', 'png', 'jpg', 'tif', 'webp', 'exr'],
            },
            quality: { type: 'number', description: 'Quality 1–100 for jpg/webp', minimum: 1, maximum: 100, default: 85 },
          },
          required: ['path'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (!args.path) return pcError('path is required', 'missing_param');
          const result = await pc.docSave({
            path: args.path as string,
            format: args.format as string | undefined,
            quality: args.quality as number | undefined,
          });
          return pcSuccess({ ok: true, path: args.path, ...normalizeDocState(result) }, `Exported to ${args.path}.`);
        }),
    },

    {
      tool: {
        name: 'photocraft_export_layers_to_files',
        description:
          'Export each layer as a separate file to a directory.\n\n' +
          'Returns: { ok, files }.',
        inputSchema: {
          type: 'object',
          properties: {
            output_dir: { type: 'string', description: 'Output directory (absolute path)' },
            format: {
              type: 'string',
              description: 'Output format',
              enum: ['png', 'jpg', 'tif', 'psd', 'webp'],
              default: 'png',
            },
            quality: { type: 'number', description: 'Quality 1–100 for jpg/webp', minimum: 1, maximum: 100, default: 85 },
          },
          required: ['output_dir'],
        },
      },
      handler: async (args) =>
        safeRun(async () => {
          if (!args.output_dir) return pcError('output_dir is required', 'missing_param');
          const result = await pc.runCommand('file.export.layersToFiles', {
            destinationFolder: args.output_dir as string,
            fileType: ((args.format as string) ?? 'png').toUpperCase(),
            quality: (args.quality as number) ?? 85,
          });
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, `Layers exported to ${args.output_dir}.`);
        }),
    },

    {
      tool: {
        name: 'photocraft_quick_export_png',
        description: 'Quick export the active layer as PNG.\n\nReturns: { ok }.',
        inputSchema: { type: 'object', properties: {} },
      },
      handler: async () =>
        safeRun(async () => {
          const result = await pc.runCommand('layer.quickExportAsPng', {});
          return pcSuccess({ ok: true, ...normalizeDocState(result) }, 'Quick export as PNG done.');
        }),
    },
  ];
}
