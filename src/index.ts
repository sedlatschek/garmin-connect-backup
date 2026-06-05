#!/usr/bin/env node

import { serializeError } from 'serialize-error';
import { LocalFileOutputCreator } from './output/LocalFileOutputCreator.js';
import { JsonSerializer } from './serializer/JsonSerializer.js';
import { resolve } from 'path';
import { createActivityService } from './services/activity-service.js';
import { createUserSummaryService } from './services/usersummary-service.js';
import { createSleepService } from './services/sleep-service.js';
import { createHealthStatusService } from './services/healthstatus-service.js';
import { createBloodPressureService } from './services/bloodpressure-service.js';
import { createGoalService } from './services/goal-service.js';
import { createHrvService } from './services/hrv-service.js';
import { GarminConnectClient } from './client/GarminConnectClient.js';
import { PuppeteerGarminConnectClient } from './client/PuppeteerGarminConnectClient.js';
import { Service } from './types/Service.js';
import { FourWeekEndpoint } from './endpoint/FourWeekEndpoint.js';
import { DailyEndpoint } from './endpoint/DailyEndpoint.js';
import { PaginatedEndpoint } from './endpoint/PaginatedEndpoint.js';
import { handleFourWeekAndDailyEndpoint } from './handler/handle-four-week-and-daily-endpoint.js';
import { handlePaginatedEndpoint } from './handler/handle-paginated-endpoint.js';
import { ConsoleLogger } from './logger/ConsoleLogger.js';
import { Logger } from './logger/Logger.js';
import { Components } from './types/Components.js';
import { getOptions } from './options/options.js';

async function main(): Promise<void> {
  const logger: Logger = new ConsoleLogger();
  const { outputDir, from, to, requestsPerSecond } = getOptions();

  const client: GarminConnectClient = new PuppeteerGarminConnectClient(logger, requestsPerSecond);
  const displayName = await client.getDisplayName();

  const components: Components = {
    logger,
    outputCreator: new LocalFileOutputCreator({ logger, outputDir: resolve(outputDir) }),
    serializer: new JsonSerializer(),
    client,
  };

  const services: Service[] = [
    createActivityService(),
    createBloodPressureService(),
    createGoalService(),
    createHealthStatusService(),
    createHrvService(),
    createSleepService(),
    createUserSummaryService(displayName),
  ];

  const allErrors: unknown[] = [];
  for (const service of services) {
    logger.service(service.name);
    for (const endpoint of service.endpoints) {
      if (endpoint instanceof FourWeekEndpoint || endpoint instanceof DailyEndpoint) {
        const { errors } = await handleFourWeekAndDailyEndpoint({ ...components, service, endpoint, from, to });
        allErrors.push(...errors);
      } else if (endpoint instanceof PaginatedEndpoint) {
        const { errors } = await handlePaginatedEndpoint({ ...components, service, endpoint, from, to });
        allErrors.push(...errors);
      } else {
        throw new Error(`Unknown endpoint type in service "${service.name}"`);
      }
    }
  }

  if (allErrors.length > 0) {
    throw new Error(`The garmin-connect-backup run had ${allErrors.length} error${allErrors.length > 1 ? 's' : ''}`, { cause: allErrors[0] });
  }
}

try {
  await main();
} catch (error) {
  console.error('An error occurred during backup:', serializeError(error));
  process.exit(1);
}
