#!/usr/bin/env node

import { serializeError } from 'serialize-error';
import { runGarminConnectBackup } from './index.js';

try {
  await runGarminConnectBackup();
} catch (error) {
  console.error('An error occurred during backup:', serializeError(error));
  process.exit(1);
}
