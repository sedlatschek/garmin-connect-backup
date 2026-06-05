import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { MultiDayEndpoint } from '../endpoint/MultiDayEndpoint.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';

const WEIGHT_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/weight-service`;

export function createWeightService(): Service {
  const weightSchema = z.looseObject({});
  return {
    name: 'weight-service',
    endpoints: [
      new DailyEndpoint(date => `${WEIGHT_SERVICE_URL}/weight/latest?date=${date.toISODate()}`, weightSchema, 'weight'),
      new MultiDayEndpoint(
        100,
        (from, to) => `${WEIGHT_SERVICE_URL}/weight/range/${from.toISODate()}/${to.toISODate()}?includeAll=true`,
        weightSchema,
        'weight_summary',
      ),
    ],
  };
}
