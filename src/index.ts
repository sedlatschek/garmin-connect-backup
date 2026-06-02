#!/usr/bin/env node

import { backupActivityService } from './services/activity-service.js';
import { LocalFileOutput } from './output/LocalFileOutput.js';
import { JsonSerializer } from './serializer/JsonSerializer.js';
import { OUTPUT_DIR } from './constants.js';
import { resolve } from 'path';

async function main(): Promise<void> {
  const output = new LocalFileOutput({ outputDir: resolve(OUTPUT_DIR) });
  const serializer = new JsonSerializer();

  const bridge = async (file: string, content: object): Promise<void> => {
    const serialized = serializer.serialize(content);
    await output.add(file, serialized);
  };

  await backupActivityService(bridge);
}

try {
  await main();
} catch (error) {
  console.error('An error occurred during backup:', error);
  process.exit(1);
}
