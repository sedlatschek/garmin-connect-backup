import { z } from 'zod';
import { DateTime } from 'luxon';
import { Bridge } from '../Bridge.js';
import { GC_API } from '../constants.js';
import { BackupOptions } from '../options.js';
import { GarminClient } from '../client.js';
import { monthlyChunks } from '../helpers.js';

const USERSUMMARY_SERVICE_URL = `${GC_API}/gc-api/usersummary-service`;
const USERSUMMARY_OUTPUT_DIR = 'usersummary';

const userSummaryStepsSchema = z.object().loose();
type UserSummarySteps = z.infer<typeof userSummaryStepsSchema>;

export async function backupUserSummary(client: GarminClient, bridge: Bridge, options: BackupOptions): Promise<void> {
  async function getUserSummary<T extends z.ZodTypeAny>(type: 'steps', schema: T, from: DateTime<true>, to: DateTime<true>): Promise<z.infer<T>> {
    return client.get(
      `${USERSUMMARY_SERVICE_URL}/stats/${type}/${from.toISODate()}/${to.toISODate()}`,
      schema,
    );
  }

  function getSteps(from: DateTime<true>, to: DateTime<true>): Promise<UserSummarySteps> {
    return getUserSummary('steps', userSummaryStepsSchema, from, to);
  }

  for (const { from, to } of monthlyChunks(options.from, options.to)) {
    await bridge.add(`${USERSUMMARY_OUTPUT_DIR}]/steps_${from.year}-${from.month}.json`, await getSteps(from, to));
  }
}
