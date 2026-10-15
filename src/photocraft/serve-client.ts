import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';
import { homedir } from 'os';
import { isAbsolute, relative, resolve as resolvePath } from 'path';
import { Logger } from '../logger.js';

const PHOTOCRAFT_CLI = 'C:\\Program Files\\PhotoCraft\\photocraft-cli.exe';
const REQUEST_TIMEOUT_MS = 30_000;
// photocraft-cli serve only touches files under explicitly granted roots, and only
// accepts paths relative to them. Default to the user's home directory.
const FS_ROOT = resolvePath(process.env.PHOTOCRAFT_FS_ROOT || homedir());

/** Convert a user-supplied path into the root-relative form photocraft-cli accepts. */
function toScopedPath(filePath: string): string {
  const abs = isAbsolute(filePath) ? filePath : resolvePath(FS_ROOT, filePath);
  const rel = relative(FS_ROOT, abs);
  if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Path "${filePath}" is outside the PhotoCraft file root "${FS_ROOT}" (set PHOTOCRAFT_FS_ROOT to change it)`);
  }
  return rel.split('\\').join('/');
}

interface JsonRpcRequest {
  id: string;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  id: string;
  result?: unknown;
  error?: string | { code?: number; message?: string; data?: unknown };
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
}

export class PhotoCraftServeClient {
  private proc: ChildProcess | null = null;
  private pending = new Map<string, PendingRequest>();
  private nextId = 1;
  private logger = new Logger('PhotoCraftServeClient');
  private ready = false;
  private startPromise: Promise<void> | null = null;

  async ensureStarted(): Promise<void> {
    if (this.ready) return;
    if (this.startPromise) return this.startPromise;
    this.startPromise = this.start();
    return this.startPromise;
  }

  private start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.info('Starting photocraft-cli serve…');
      this.proc = spawn(PHOTOCRAFT_CLI, [
        'serve',
        '--automation-read-root', FS_ROOT,
        '--automation-write-root', FS_ROOT,
      ], {
        cwd: FS_ROOT,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (!this.proc.stdout || !this.proc.stdin) {
        return reject(new Error('Failed to open photocraft-cli serve stdio'));
      }

      const rl = createInterface({ input: this.proc.stdout });

      rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        try {
          const msg: JsonRpcResponse = JSON.parse(trimmed);
          this.handleResponse(msg);
        } catch {
          this.logger.debug('Ignoring non-JSON line from photocraft-cli:', trimmed.slice(0, 120));
        }
      });

      this.proc.stderr?.on('data', (chunk) => {
        const text = String(chunk).trim();
        if (text) this.logger.debug('photocraft-cli stderr:', text.slice(0, 200));
      });

      this.proc.on('error', (err) => {
        this.logger.error('photocraft-cli process error:', err);
        this.rejectAllPending(err);
        this.ready = false;
        this.startPromise = null;
        reject(err);
      });

      this.proc.on('exit', (code) => {
        this.logger.info(`photocraft-cli exited with code ${code}`);
        this.rejectAllPending(new Error(`photocraft-cli exited (code ${code})`));
        this.ready = false;
        this.startPromise = null;
        this.proc = null;
      });

      // Use the 'methods' request to confirm the server is up
      const readyTimer = setTimeout(() => {
        reject(new Error('Timeout waiting for photocraft-cli serve to start'));
      }, 10_000);

      this.ready = true;
      this.call('methods', {})
        .then(() => {
          clearTimeout(readyTimer);
          resolve();
        })
        .catch((err) => {
          clearTimeout(readyTimer);
          // Server started but 'methods' may not exist — still up
          this.logger.debug('methods ping result:', err);
          resolve();
        });
    });
  }

  private handleResponse(msg: JsonRpcResponse): void {
    const pending = this.pending.get(msg.id);
    if (!pending) {
      this.logger.debug('Received response for unknown id:', msg.id);
      return;
    }
    clearTimeout(pending.timer);
    this.pending.delete(msg.id);

    if (msg.error) {
      const detail = typeof msg.error === 'string'
        ? msg.error
        : `${msg.error.code ?? ''} ${msg.error.message ?? JSON.stringify(msg.error)}`.trim();
      pending.reject(new Error(`PhotoCraft error: ${detail}`));
    } else {
      pending.resolve(msg.result);
    }
  }

  private rejectAllPending(err: Error): void {
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(err);
    }
    this.pending.clear();
  }

  async call(method: string, params: unknown, timeoutMs = REQUEST_TIMEOUT_MS): Promise<unknown> {
    await this.ensureStarted();

    const id = String(this.nextId++);
    const req: JsonRpcRequest = { id, method, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`PhotoCraft request "${method}" timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });

      const line = JSON.stringify(req) + '\n';
      this.proc?.stdin?.write(line, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(new Error(`Failed to write to photocraft-cli: ${err.message}`));
        }
      });
    });
  }

  /** Run an engine command (from photocraft-cli commands list). */
  async execute(commandId: string, params?: unknown, timeoutMs?: number): Promise<unknown> {
    return this.call('engine.execute', { command: commandId, params: params ?? {} }, timeoutMs);
  }

  /** Open an existing file, returns document handle. */
  async docOpen(filePath: string): Promise<unknown> {
    return this.call('doc.open', { path: toScopedPath(filePath) });
  }

  /** Create a new document. */
  async docNew(params: {
    width?: number;
    height?: number;
    mode?: string;
    depth?: number;
    background?: string;
    resolution?: number;
    name?: string;
  }): Promise<unknown> {
    return this.call('doc.new', params);
  }

  /** Save the active/specified document. */
  async docSave(params: { path?: string; format?: string; quality?: number; document?: number }): Promise<unknown> {
    return this.call('doc.save', params.path ? { ...params, path: toScopedPath(params.path) } : params);
  }

  /** Inspect a document — returns full JSON state. */
  async docInspect(document?: number): Promise<unknown> {
    return this.call('doc.inspect', document !== undefined ? { document } : {});
  }

  /** Close a document. */
  async docClose(params?: { document?: number; save?: boolean }): Promise<unknown> {
    return this.call('doc.close', params ?? {});
  }

  /** Select / make a document active. */
  async docSelect(document: number): Promise<unknown> {
    return this.call('doc.select', { document });
  }

  /** List open documents (session.list). */
  async sessionList(): Promise<unknown> {
    return this.call('session.list', {});
  }

  /** Inspect the session (global state). */
  async sessionInspect(): Promise<unknown> {
    return this.call('session.inspect', {});
  }

  isRunning(): boolean {
    return this.ready && this.proc !== null;
  }

  stop(): void {
    this.rejectAllPending(new Error('PhotoCraft serve client stopped'));
    this.proc?.stdin?.end();
    this.proc?.kill();
    this.proc = null;
    this.ready = false;
    this.startPromise = null;
  }
}
