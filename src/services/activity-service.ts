import { z } from 'zod';
import { CONNECT_API, PAGE_SIZE } from '../constants.js';
import { join } from 'node:path';
import { Bridge } from '../Bridge.js';
import { GarminConnectClient } from '../client/GarminConnectClient.js';

const ACTIVITY_SERVICE_URL = `${CONNECT_API}/activity-service`;
const ACTIVITY_LIST_SERVICE_URL = `${CONNECT_API}/activitylist-service`;
const ACTIVITY_OUTPUT_DIR = 'activities';

const activitySchema = z.object({
  activityId: z.number(),
}).loose();

type Activity = z.infer<typeof activitySchema>;

export async function backupActivityService(client: GarminConnectClient, bridge: Bridge): Promise<void> {
  async function getActivities(start = 0, limit = 100): Promise<Activity[]> {
    return client.get(
      `${ACTIVITY_LIST_SERVICE_URL}/activities/search/activities?start=${start}&limit=${limit}`,
      z.array(activitySchema),
    );
  }

  async function* getAllActivities(pageSize = PAGE_SIZE): AsyncGenerator<Activity, void, unknown> {
    let start = 0;
    while (true) {
      const page = await getActivities(start, pageSize);
      yield* page;
      if (page.length < pageSize) {
        break;
      }
      start += pageSize;
    }
  };

  // The output of this endpoint differs from the list endpoint; it has more details.
  function getActivity(activityId: number): Promise<Activity> {
    return client.get(
      `${ACTIVITY_SERVICE_URL}/activity/${activityId}`,
      activitySchema,
    );
  }

  for await (const activity of getAllActivities()) {
    await bridge.add(join(ACTIVITY_OUTPUT_DIR, `${activity.activityId}_summary.json`), activity);
    const activityFile = join(ACTIVITY_OUTPUT_DIR, `${activity.activityId}.json`);
    if (!await bridge.exists(activityFile)) {
      await bridge.add(activityFile, await getActivity(activity.activityId));
    }
  }
}
