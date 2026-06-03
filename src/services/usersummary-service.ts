import { z } from 'zod';
import { DateTime } from 'luxon';
import { Bridge } from '../Bridge.js';
import { GC_API } from '../constants.js';
import { BackupOptions } from '../options.js';
import { exists, fourWeekChunks } from '../helpers.js';
import { GarminConnectClient } from '../client/GarminConnectClient.js';

const USERSUMMARY_SERVICE_URL = `${GC_API}/usersummary-service`;
const USERSUMMARY_OUTPUT_DIR = 'usersummary';

const userSummaryStepsSchema = z.looseObject({});
type UserSummarySteps = z.infer<typeof userSummaryStepsSchema>;

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

  for (const { from, to } of fourWeekChunks(options.from, options.to)) {
    const file = `${USERSUMMARY_OUTPUT_DIR}/steps_${from.toISODate()}-${to.toISODate()}.json`;
    if (!await exists(file)) {
      await bridge.add(file, await getSteps(from, to));
    }
  }
}
