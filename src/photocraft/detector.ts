import { access, constants } from 'fs/promises';
import { Logger } from '../logger.js';

const PHOTOCRAFT_CLI = 'C:\\Program Files\\PhotoCraft\\photocraft-cli.exe';
const PHOTOCRAFT_EXE = 'C:\\Program Files\\PhotoCraft\\photocraft.exe';

export interface PhotoCraftInfo {
  version: string;
  cliPath: string;
  exePath: string;
}

export class PhotoCraftDetector {
  private logger = new Logger('PhotoCraftDetector');

  async detect(): Promise<PhotoCraftInfo | null> {
    const envPath = process.env.PHOTOCRAFT_PATH;
    const cliPath = envPath ? `${envPath}\\photocraft-cli.exe` : PHOTOCRAFT_CLI;
    const exePath = envPath ? `${envPath}\\photocraft.exe` : PHOTOCRAFT_EXE;

    try {
      await access(cliPath, constants.F_OK);
      this.logger.info(`Found PhotoCraft CLI at: ${cliPath}`);
      return { version: 'detected', cliPath, exePath };
    } catch {
      this.logger.debug('PhotoCraft not found at', cliPath);
      return null;
    }
  }
}
