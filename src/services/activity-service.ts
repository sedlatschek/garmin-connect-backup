import { z } from 'zod';
import { GARMIN_CONNECT_API_URL, PAGE_SIZE } from '../constants.js';
import { Service } from '../Service.js';
import { PaginatedEndpoint } from '../endpoint/PaginatedEndpoint.js';

const ACTIVITY_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/activity-service`;
const ACTIVITY_LIST_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/activitylist-service`;

const activitySchema = z.object({
  activityId: z.number(),
}).loose();

export function createActivityService(): Service {
  return {
    name: 'activities',
    endpoints: [
      new PaginatedEndpoint({
        listUrlBuilder: (start, limit) => `${ACTIVITY_LIST_SERVICE_URL}/activities/search/activities?start=${start}&limit=${limit}`,
        listSchema: z.array(activitySchema),
        summaryFileNameBuilder: activity => `${activity.activityId}_summary.json`,
        pageSize: PAGE_SIZE,
        detail: {
          urlBuilder: activity => `${ACTIVITY_SERVICE_URL}/activity/${activity.activityId}`,
          schema: activitySchema,
          fileNameBuilder: activity => `${activity.activityId}.json`,
        },
      }),
    ],
  };
}
