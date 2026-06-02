#!/usr/bin/env node

import { backupActivityService } from './services/activity-service.js';
import { LocalFileOutput } from './output/LocalFileOutput.js';
import { JsonSerializer } from './serializer/JsonSerializer.js';
import { OUTPUT_DIR } from './constants.js';
import { resolve } from 'path';
import { Bridge } from './Bridge.js';
import { options } from './options.js';
import { GarminClient } from './client.js';
import { backupUserSummary } from './services/usersummary-service.js';

async function main(): Promise<void> {
  const output = new LocalFileOutput({ outputDir: resolve(OUTPUT_DIR) });
  const serializer = new JsonSerializer();
  const outputSerializerBridge = new Bridge(output, serializer);

  const client = await GarminClient.create(options.requestsPerSecond);

  // await backupActivityService(client, outputSerializerBridge);
  await backupUserSummary(client, outputSerializerBridge, options);
}

try {
  await main();
} catch (error) {
  console.error('An error occurred during backup:', error);
  process.exit(1);
}
