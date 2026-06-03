import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../Service.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';
import { FourWeekEndpoint } from '../endpoint/FourWeekEndpoint.js';

const SLEEP_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/sleep-service`;

export function createSleepService(): Service {
  const sleepSummarySchema = z.looseObject({});
  return {
    name: 'sleep-service',
    endpoints: [
      new FourWeekEndpoint((from, to) => `${SLEEP_SERVICE_URL}/stats/sleep/daily/${from.toISODate()}/${to.toISODate()}`, sleepSummarySchema, 'summary'),
      new DailyEndpoint(
        date => `${SLEEP_SERVICE_URL}/sleep/dailySleepData/?date=${date.toISODate()}&nonSleepBufferMinutes=60`,
        sleepSummarySchema,
        'daily',
      ),
    ],
  };
}
