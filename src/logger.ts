const LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const;
type Level = 0 | 1 | 2 | 3;

function threshold(): Level {
  const n = Number(process.env.LOG_LEVEL);
  return (Number.isInteger(n) && n >= 0 && n <= 3 ? n : 1) as Level;
}

function format(arg: unknown): string {
  if (arg instanceof Error) return arg.stack ?? arg.message;
  return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
}

/**
 * Scoped logger. Writes to stderr only: stdout carries the MCP protocol stream.
 * Verbosity comes from LOG_LEVEL (0 debug, 1 info, 2 warn, 3 error; default 1).
 */
export class Logger {
  private readonly min = threshold();

  constructor(private readonly scope: string) {}

  private write(level: Level, message: string, args: unknown[]): void {
    if (level < this.min) return;
    const extra = args.length ? ' ' + args.map(format).join(' ') : '';
    process.stderr.write(`[${new Date().toISOString()}] ${LEVELS[level]} ${this.scope}: ${message}${extra}\n`);
  }

  debug(message: string, ...args: unknown[]): void {
    this.write(0, message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.write(1, message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.write(2, message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.write(3, message, args);
  }
}
