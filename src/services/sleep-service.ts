import { z } from 'zod';
import { DateTime } from 'luxon';
import { Bridge } from '../Bridge.js';
import { GC_API } from '../constants.js';
import { BackupOptions } from '../options.js';
import { fourWeekChunks, daily } from '../helpers.js';
import { GarminConnectClient } from '../client/GarminConnectClient.js';

const SLEEP_SERVICE_URL = `${GC_API}/sleep-service`;
const SLEEP_OUTPUT_DIR = 'sleep';

const sleepSummarySchema = z.looseObject({});
type SleepSummary = z.infer<typeof sleepSummarySchema>;

export async function backupSleep(client: GarminConnectClient, bridge: Bridge, options: BackupOptions): Promise<void> {
  async function getSleepSummary(from: DateTime<true>, to: DateTime<true>): Promise<SleepSummary> {
    return client.get(
      `${SLEEP_SERVICE_URL}/stats/sleep/daily/${from.toISODate()}/${to.toISODate()}`,
      sleepSummarySchema,
    );
  }

  async function getSleepDaily(date: DateTime<true>): Promise<SleepSummary> {
    return client.get(
      `${SLEEP_SERVICE_URL}/sleep/dailySleepData/?date=${date.toISODate()}&nonSleepBufferMinutes=60`,
      sleepSummarySchema,
    );
  }

  for (const { from, to, complete } of fourWeekChunks(options.from, options.to)) {
    if (!complete) {
      console.info(`Chunk ${from.toISODate()} to ${to.toISODate()} is not complete, skipping (will be re-fetched in a future run)`);
      continue;
    }

    const fileName = `${SLEEP_OUTPUT_DIR}/summary_${from.toISODate()}-${to.toISODate()}.json`;
    if (await bridge.exists(fileName)) {
      console.info(`> Skipping ${fileName} (already exists)`);
    } else {
      await bridge.add(fileName, await getSleepSummary(from, to));
    }
  }

  for (const { date } of daily(options.from, options.to)) {
    const fileName = `${SLEEP_OUTPUT_DIR}/daily_${date.toISODate()}.json`;
    if (await bridge.exists(fileName)) {
      console.info(`> Skipping ${fileName} (already exists)`);
    } else {
      await bridge.add(fileName, await getSleepDaily(date));
    }
  }
}
