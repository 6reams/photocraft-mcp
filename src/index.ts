#!/usr/bin/env node
import { runServer } from './server.js';
import { Logger } from './logger.js';

const logger = new Logger('main');

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});

runServer().catch((err) => {
  logger.error('Fatal error starting PhotoCraft MCP server:', err);
  process.exit(1);
});
