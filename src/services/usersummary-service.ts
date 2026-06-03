import { z } from 'zod';
import { DateTime } from 'luxon';
import { Bridge } from '../Bridge.js';
import { GC_API } from '../constants.js';
import { BackupOptions } from '../options.js';
import { fourWeekChunks } from '../helpers.js';
import { GarminConnectClient } from '../client/GarminConnectClient.js';

const USERSUMMARY_SERVICE_URL = `${GC_API}/usersummary-service`;
const USERSUMMARY_OUTPUT_DIR = 'usersummary';

const userSummaryStepsSchema = z.looseObject({});
type UserSummarySteps = z.infer<typeof userSummaryStepsSchema>;

const userSummaryFloorsSchema = z.array(z.looseObject({}));
type UserSummaryFloors = z.infer<typeof userSummaryFloorsSchema>;

const userSummaryIntensityMinutesSchema = z.array(z.looseObject({}));
type UserSummaryIntensityMinutes = z.infer<typeof userSummaryIntensityMinutesSchema>;

export async function backupUserSummary(client: GarminConnectClient, bridge: Bridge, options: BackupOptions): Promise<void> {
  async function getUserSummary<T extends z.ZodTypeAny>(type: 'steps', schema: T, from: DateTime<true>, to: DateTime<true>): Promise<z.infer<T>> {
    return client.get(
      `${USERSUMMARY_SERVICE_URL}/stats/daily/${from.toISODate()}/${to.toISODate()}?statsType=${type.toUpperCase()}&currentDate=${DateTime.now().toISODate()}`,
      schema,
    );
  }

  function getSteps(from: DateTime<true>, to: DateTime<true>): Promise<UserSummarySteps> {
    return getUserSummary('steps', userSummaryStepsSchema, from, to);
  }

  async function getFloors(from: DateTime<true>, to: DateTime<true>): Promise<UserSummaryFloors> {
    return client.get(
      `${USERSUMMARY_SERVICE_URL}/stats/floors/daily/${from.toISODate()}/${to.toISODate()}`,
      userSummaryFloorsSchema,
    );
  }

  async function getIntensityMinutes(from: DateTime<true>, to: DateTime<true>): Promise<UserSummaryIntensityMinutes> {
    return client.get(
      `${USERSUMMARY_SERVICE_URL}/stats/im/daily/${from.toISODate()}/${to.toISODate()}`,
      userSummaryIntensityMinutesSchema,
    );
  }

  for (const { from, to, complete } of fourWeekChunks(options.from, options.to)) {
    if (!complete) {
      console.info(`Chunk ${from.toISODate()} to ${to.toISODate()} is not complete, skipping (will be re-fetched in a future run)`);
      continue;
    }

    const stepsFileName = `${USERSUMMARY_OUTPUT_DIR}/steps_${from.toISODate()}-${to.toISODate()}.json`;
    if (await bridge.exists(stepsFileName)) {
      console.info(`> Skipping ${stepsFileName} (already exists)`);
    } else {
      await bridge.add(stepsFileName, await getSteps(from, to));
    }

    const floorsFileName = `${USERSUMMARY_OUTPUT_DIR}/floors_${from.toISODate()}-${to.toISODate()}.json`;
    if (await bridge.exists(floorsFileName)) {
      console.info(`> Skipping ${floorsFileName} (already exists)`);
    } else {
      await bridge.add(floorsFileName, await getFloors(from, to));
    }

    const intensityMinutesFileName = `${USERSUMMARY_OUTPUT_DIR}/intensityMinutes_${from.toISODate()}-${to.toISODate()}.json`;
    if (await bridge.exists(intensityMinutesFileName)) {
      console.info(`> Skipping ${intensityMinutesFileName} (already exists)`);
    } else {
      await bridge.add(intensityMinutesFileName, await getIntensityMinutes(from, to));
    }
  }
}
