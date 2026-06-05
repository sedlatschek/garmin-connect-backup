import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { FourWeekEndpoint } from '../endpoint/FourWeekEndpoint.js';

const USERSTATS_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/userstats-service`;

export function createUserStatsService(userId: string): Service {
  const wellnessDailySchema = z.looseObject({});
  return {
    name: 'userstats-service',
    endpoints: [
      new FourWeekEndpoint(
        (from, to) => `${USERSTATS_SERVICE_URL}/wellness/daily/${userId}?fromDate=${from.toISODate()}&untilDate=${to.toISODate()}`,
        wellnessDailySchema,
        'wellness_daily',
      ),
    ],
  };
}
