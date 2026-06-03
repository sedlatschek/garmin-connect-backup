#!/usr/bin/env node

import { LocalFileOutput } from './output/LocalFileOutput.js';
import { JsonSerializer } from './serializer/JsonSerializer.js';
import { OUTPUT_DIR } from './constants.js';
import { resolve } from 'path';
import { createActivityService } from './services/activity-service.js';
import { createUserSummaryService } from './services/usersummary-service.js';
import { createSleepService } from './services/sleep-service.js';
import { createHealthStatusService } from './services/healthstatus-service.js';
import { GarminConnectClient } from './client/GarminConnectClient.js';
import { PuppeteerGarminConnectClient } from './client/PuppeteerGarminConnectClient.js';
import { Service } from './Service.js';
import { FourWeekEndpoint } from './endpoint/FourWeekEndpoint.js';
import { DailyEndpoint } from './endpoint/DailyEndpoint.js';
import { PaginatedEndpoint } from './endpoint/PaginatedEndpoint.js';
import { handleFourWeekAndDailyEndpoint } from './handler/handle-four-week-and-daily-endpoint.js';
import { handlePaginatedEndpoint } from './handler/handle-paginated-endpoint.js';

async function main(): Promise<void> {
  const client: GarminConnectClient = new PuppeteerGarminConnectClient();
  const displayName = await client.getDisplayName();

  const components = {
    output: new LocalFileOutput({ outputDir: resolve(OUTPUT_DIR) }),
    serializer: new JsonSerializer(),
    client,
  };

  const services: Service[] = [
    createActivityService(),
    createHealthStatusService(),
    createSleepService(),
    createUserSummaryService(displayName),
  ];

  for (const service of services) {
    console.info(`Backing up ${service.name}...`);
    for (const endpoint of service.endpoints) {
      if (endpoint instanceof FourWeekEndpoint || endpoint instanceof DailyEndpoint) {
        handleFourWeekAndDailyEndpoint({ ...components, service, endpoint });
      } else if (endpoint instanceof PaginatedEndpoint) {
        handlePaginatedEndpoint({ ...components, service, endpoint });
      } else {
        throw new Error(`Unknown endpoint type in service "${service.name}"`);
      }
    }
  }
}

try {
  await main();
} catch (error) {
  console.error('An error occurred during backup:', error);
  process.exit(1);
}
