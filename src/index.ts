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
import { createWeightService } from './services/weight-service.js';
import { createWellnessService } from './services/wellness-service.js';
import { createDeviceService } from './services/device-service.js';
import { createUserProfileService } from './services/userprofile-service.js';
import { createFitnessAgeService } from './services/fitnessage-service.js';
import { createNutritionService } from './services/nutrition-service.js';
import { createUserStatsService } from './services/userstats-service.js';
import { createMetricsService } from './services/metrics-service.js';
import { LiveEndpoint } from './endpoint/LiveEndpoint.js';
import { handleLiveEndpoint } from './handler/handle-live-endpoint.js';
import { MultiDayEndpoint } from './endpoint/MultiDayEndpoint.js';
import { GarminConnectClient } from './client/GarminConnectClient.js';
import { PuppeteerGarminConnectClient } from './client/PuppeteerGarminConnectClient.js';
import { Service } from './types/Service.js';
import { DailyEndpoint } from './endpoint/DailyEndpoint.js';
import { PaginatedEndpoint } from './endpoint/PaginatedEndpoint.js';
import { handleFourWeekAndDailyEndpoint } from './handler/handle-four-week-and-daily-endpoint.js';
import { handlePaginatedEndpoint } from './handler/handle-paginated-endpoint.js';
import { ConsoleLogger } from './logger/ConsoleLogger.js';
import { Logger } from './logger/Logger.js';
import { Components } from './types/Components.js';
import { getOptions } from './config/config.js';
import { GarminConnectBackupError } from './error/GarminConnectBackupError.js';

export async function runGarminConnectBackup(): Promise<void> {
  const logger: Logger = new ConsoleLogger();
  const { outputDir, from, to, requestsPerSecond, username, password, services: enabledServices } = await getOptions();

  const client: GarminConnectClient = new PuppeteerGarminConnectClient(logger, requestsPerSecond, username, password);
  const displayName = await client.getDisplayName();

  const components: Components = {
    logger,
    outputCreator: new LocalFileOutputCreator({ logger, outputDir: resolve(outputDir) }),
    serializer: new JsonSerializer(),
    client,
  };

  const allServices: Service[] = [
    createActivityService(),
    createBloodPressureService(),
    createGoalService(),
    createHealthStatusService(),
    createHrvService(),
    createSleepService(),
    createWeightService(),
    createUserSummaryService(displayName),
    createWellnessService(displayName),
    createDeviceService(displayName),
    createUserProfileService(displayName),
    createFitnessAgeService(),
    createNutritionService(),
    createUserStatsService(displayName),
    createMetricsService(),
  ];

  const services: Service[] = enabledServices
    ? allServices.filter(s => enabledServices.includes(s.name))
    : allServices;

  const allErrors: unknown[] = [];
  for (const service of services) {
    logger.service(service.name);
    for (const endpoint of service.endpoints) {
      if (endpoint instanceof MultiDayEndpoint || endpoint instanceof DailyEndpoint) {
        const { errors } = await handleFourWeekAndDailyEndpoint({ ...components, service, endpoint, from, to });
        allErrors.push(...errors);
      } else if (endpoint instanceof PaginatedEndpoint) {
        const { errors } = await handlePaginatedEndpoint({ ...components, service, endpoint, from, to });
        allErrors.push(...errors);
      } else if (endpoint instanceof LiveEndpoint) {
        const { errors } = await handleLiveEndpoint({ ...components, service, endpoint });
        allErrors.push(...errors);
      } else {
        throw new GarminConnectBackupError(`Unknown endpoint type in service "${service.name}"`);
      }
    }
  }

  if (allErrors.length > 0) {
    throw new GarminConnectBackupError(`The garmin-connect-backup run had ${allErrors.length} error${allErrors.length > 1 ? 's' : ''}`, { cause: allErrors[0] });
  }
}
