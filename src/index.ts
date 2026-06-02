#!/usr/bin/env node

import { backupActivityService } from './services/activity-service.js';
import { LocalFileOutput } from './output/LocalFileOutput.js';
import { JsonSerializer } from './serializer/JsonSerializer.js';
import { OUTPUT_DIR } from './constants.js';
import { resolve } from 'path';
import { Bridge } from './Bridge.js';
import { options } from './options.js';

async function main(): Promise<void> {
  const output = new LocalFileOutput({ outputDir: resolve(OUTPUT_DIR) });
  const serializer = new JsonSerializer();
  const outputSerializerBridge = new Bridge(output, serializer);

  await backupActivityService(outputSerializerBridge, options);
}

try {
  await main();
} catch (error) {
  console.error('An error occurred during backup:', error);
  process.exit(1);
}
