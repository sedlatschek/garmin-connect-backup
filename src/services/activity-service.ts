import { z } from 'zod';
import { GARMIN_CONNECT_API_URL, DEFAULT_PAGE_SIZE } from '../constants.js';
import { Service } from '../types/Service.js';
import { PaginatedEndpoint } from '../endpoint/PaginatedEndpoint.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';
import { LiveEndpoint } from '../endpoint/LiveEndpoint.js';
import { dateTimeFromGarminGmt } from '../helpers.js';

const ACTIVITY_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/activity-service`;
const ACTIVITY_LIST_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/activitylist-service`;

const activitySchema = z.object({
  activityId: z.number(),
  startTimeGMT: z.string(),
}).loose();

const activityDetailSchema = z.object({
  activityId: z.number(),
  summaryDTO: z.object({
    startTimeGMT: z.string(),
  }).loose(),
}).loose();

export function createActivityService(): Service {
  return {
    name: 'activities',
    endpoints: [
      new PaginatedEndpoint({
        listUrlBuilder: (start, limit) => `${ACTIVITY_LIST_SERVICE_URL}/activities/search/activities?start=${start}&limit=${limit}`,
        listSchema: z.array(activitySchema),
        summaryNameBuilder: activity => `${activity.activityId}_summary`,
        pageSize: DEFAULT_PAGE_SIZE,
        dateExtractor: activity => dateTimeFromGarminGmt(activity.startTimeGMT),
        detail: {
          urlBuilder: activity => `${ACTIVITY_SERVICE_URL}/activity/${activity.activityId}`,
          schema: activityDetailSchema,
          nameBuilder: activity => `${activity.activityId}`,
        },
      }),
      new LiveEndpoint(
        `${ACTIVITY_SERVICE_URL}/activity/activityTypes`,
        z.array(z.looseObject({})),
        'activity_types',
      ),
    ],
  };
}
