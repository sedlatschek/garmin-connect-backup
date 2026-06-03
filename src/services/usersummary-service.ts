import { z } from 'zod';
import { DateTime } from 'luxon';
import { Bridge } from '../Bridge.js';
import { GC_API } from '../constants.js';
import { BackupOptions } from '../options.js';
import { daily, fourWeekChunks } from '../helpers.js';
import { GarminConnectClient } from '../client/GarminConnectClient.js';

const USERSUMMARY_SERVICE_URL = `${GC_API}/usersummary-service`;
const USERSUMMARY_OUTPUT_DIR = 'usersummary';

const userSummaryDailySchema = z.looseObject({});
type UserSummaryDaily = z.infer<typeof userSummaryDailySchema>;

const userSummaryStepsSchema = z.looseObject({});
type UserSummarySteps = z.infer<typeof userSummaryStepsSchema>;

const userSummaryFloorsSchema = z.array(z.looseObject({}));
type UserSummaryFloors = z.infer<typeof userSummaryFloorsSchema>;

const userSummaryIntensityMinutesSchema = z.array(z.looseObject({}));
type UserSummaryIntensityMinutes = z.infer<typeof userSummaryIntensityMinutesSchema>;

export async function backupUserSummary(client: GarminConnectClient, bridge: Bridge, options: BackupOptions): Promise<void> {
  async function getSteps(from: DateTime<true>, to: DateTime<true>): Promise<UserSummarySteps> {
    return client.get(
      `${USERSUMMARY_SERVICE_URL}/stats/daily/${from.toISODate()}/${to.toISODate()}?statsType=STEPS&currentDate=${DateTime.now().toISODate()}`,
      userSummaryStepsSchema,
    );
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

  async function getDailySummary(date: DateTime<true>): Promise<UserSummaryDaily> {
    const userId = await client.getDisplayName();
    return client.get(
      `${USERSUMMARY_SERVICE_URL}/usersummary/daily/${userId}/?calendarDate=${date.toISODate()}`,
      userSummaryDailySchema,
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

  for (const { date } of daily(options.from, options.to)) {
    const fileName = `${USERSUMMARY_OUTPUT_DIR}/daily_${date.toISODate()}.json`;
    if (await bridge.exists(fileName)) {
      console.info(`> Skipping ${fileName} (already exists)`);
    } else {
      await bridge.add(fileName, await getDailySummary(date));
    }
  }
}
