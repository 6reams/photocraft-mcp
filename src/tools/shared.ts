import type { CallToolResult, Tool } from '@modelcontextprotocol/sdk/types.js';

export type ToolResult = CallToolResult;

/** An MCP tool schema paired with the function that runs it. */
export interface ToolDefinition {
  tool: Tool;
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}

export function pcSuccess(data: unknown, summary?: string): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: summary
          ? `${summary}\n\n${JSON.stringify(data, null, 2)}`
          : JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function pcError(message: string, code?: string): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ ok: false, code: code ?? 'error', message }),
      },
    ],
    isError: true,
  };
}

export async function safeRun(
  fn: () => Promise<ToolResult>
): Promise<ToolResult> {
  try {
    return await fn();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return pcError(msg);
  }
}

/** Normalize PhotoCraft doc inspect result to a common shape. */
export function normalizeDocState(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null) return {};
  return raw as Record<string, unknown>;
}
