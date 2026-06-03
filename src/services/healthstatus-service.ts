import { z } from 'zod';
import { DateTime } from 'luxon';
import { Bridge } from '../Bridge.js';
import { GC_API } from '../constants.js';
import { BackupOptions } from '../options.js';
import { fourWeekChunks } from '../helpers.js';
import { GarminConnectClient } from '../client/GarminConnectClient.js';

const HEALTHSTATUS_SERVICE_URL = `${GC_API}/healthstatus-service`;
const HEALTHSTATUS_OUTPUT_DIR = 'healthstatus';

const healthStatusSchema = z.array(z.looseObject({}));
type HealthStatus = z.infer<typeof healthStatusSchema>;

export async function backupHealthStatus(client: GarminConnectClient, bridge: Bridge, options: BackupOptions): Promise<void> {
  async function getHealthStatus(from: DateTime<true>, to: DateTime<true>): Promise<HealthStatus> {
    return client.get(
      `${HEALTHSTATUS_SERVICE_URL}/healthstatus/summary/${from.toISODate()}/${to.toISODate()}`,
      healthStatusSchema,
    );
  }

  for (const { from, to, complete } of fourWeekChunks(options.from, options.to)) {
    if (!complete) {
      console.info(`Chunk ${from.toISODate()} to ${to.toISODate()} is not complete, skipping (will be re-fetched in a future run)`);
      continue;
    }

    const fileName = `${HEALTHSTATUS_OUTPUT_DIR}/summary_${from.toISODate()}-${to.toISODate()}.json`;
    if (await bridge.exists(fileName)) {
      console.info(`> Skipping ${fileName} (already exists)`);
    } else {
      await bridge.add(fileName, await getHealthStatus(from, to));
    }
  }
}
