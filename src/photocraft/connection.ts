import { PhotoCraftDetector, PhotoCraftInfo } from './detector.js';
import { PhotoCraftServeClient } from './serve-client.js';

/**
 * Manages the photocraft-cli serve subprocess and exposes typed command execution.
 *
 * Tools that target PhotoCraft call runCommand() or the high-level doc* helpers
 * instead of the ExtendScript-based executeScript().
 */
export class PhotoCraftConnection {
  private detector = new PhotoCraftDetector();
  private _client: PhotoCraftServeClient | null = null;
  private info: PhotoCraftInfo | null = null;
  private detectPromise: Promise<PhotoCraftInfo | null> | null = null;

  get client(): PhotoCraftServeClient {
    if (!this._client) throw new Error('PhotoCraft serve client not started');
    return this._client;
  }

  async detect(): Promise<PhotoCraftInfo | null> {
    if (this.info) return this.info;
    if (this.detectPromise) return this.detectPromise;
    this.detectPromise = this.detector.detect().then((i) => {
      this.info = i;
      return i;
    });
    return this.detectPromise;
  }

  async ensureReady(): Promise<void> {
    const info = await this.detect();
    if (!info) throw new Error('PhotoCraft is not installed on this system');
    if (!this._client) {
      this._client = new PhotoCraftServeClient();
    }
    await this._client.ensureStarted();
  }

  async ping(): Promise<boolean> {
    try {
      const info = await this.detect();
      return info !== null;
    } catch {
      return false;
    }
  }

  /** Run a PhotoCraft engine command (see `photocraft-cli commands`). */
  async runCommand(commandId: string, params?: unknown, timeoutMs?: number): Promise<unknown> {
    await this.ensureReady();
    return this.client.execute(commandId, params, timeoutMs);
  }

  /** Open an existing file. Returns document handle. */
  async docOpen(filePath: string): Promise<unknown> {
    await this.ensureReady();
    return this.client.docOpen(filePath);
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
    await this.ensureReady();
    return this.client.docNew(params);
  }

  /** Save the current document. */
  async docSave(params: {
    path?: string;
    format?: string;
    quality?: number;
    document?: number;
  }): Promise<unknown> {
    await this.ensureReady();
    return this.client.docSave(params);
  }

  /** Inspect a document — returns full JSON state tree. */
  async docInspect(document?: number): Promise<unknown> {
    await this.ensureReady();
    return this.client.docInspect(document);
  }

  /** Close a document. */
  async docClose(params?: { document?: number; save?: boolean }): Promise<unknown> {
    await this.ensureReady();
    return this.client.docClose(params);
  }

  /** Make a document active. */
  async docSelect(document: number): Promise<unknown> {
    await this.ensureReady();
    return this.client.docSelect(document);
  }

  /** List open documents. */
  async sessionList(): Promise<unknown> {
    await this.ensureReady();
    return this.client.sessionList();
  }

  /** Full session state. */
  async sessionInspect(): Promise<unknown> {
    await this.ensureReady();
    return this.client.sessionInspect();
  }

  getInfo(): PhotoCraftInfo | null {
    return this.info;
  }

  stop(): void {
    this._client?.stop();
    this._client = null;
  }
}
