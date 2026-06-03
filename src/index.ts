#!/usr/bin/env node

import { backupActivityService } from './services/activity-service.js';
import { LocalFileOutput } from './output/LocalFileOutput.js';
import { JsonSerializer } from './serializer/JsonSerializer.js';
import { OUTPUT_DIR } from './constants.js';
import { resolve } from 'path';
import { Bridge } from './Bridge.js';
import { options } from './options.js';
import { backupUserSummary } from './services/usersummary-service.js';
import { backupSleep } from './services/sleep-service.js';
import { backupHealthStatus } from './services/healthstatus-service.js';
import { GarminConnectClient } from './client/GarminConnectClient.js';
import { PuppeteerGarminConnectClient } from './client/PuppeteerGarminConnectClient.js';

async function main(): Promise<void> {
  const output = new LocalFileOutput({ outputDir: resolve(OUTPUT_DIR) });
  const serializer = new JsonSerializer();
  const outputSerializerBridge = new Bridge(output, serializer);

  const client: GarminConnectClient = new PuppeteerGarminConnectClient();

  // console.info('Backing up activities...');
  // await backupActivityService(client, outputSerializerBridge);

  console.info('Backing up user summary...');
  await backupUserSummary(client, outputSerializerBridge, options);

  console.info('Backing up sleep...');
  await backupSleep(client, outputSerializerBridge, options);

  console.info('Backing up health status...');
  await backupHealthStatus(client, outputSerializerBridge, options);
}

try {
  await main();
} catch (error) {
  console.error('An error occurred during backup:', error);
  process.exit(1);
}
