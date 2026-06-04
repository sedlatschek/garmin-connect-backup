import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';
import { FourWeekEndpoint } from '../endpoint/FourWeekEndpoint.js';

const HRV_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/hrv-service`;

export function createHrvService(): Service {
  const hrvSchema = z.looseObject({});
  return {
    name: 'hrv-service',
    endpoints: [
      new FourWeekEndpoint((from, to) => `${HRV_SERVICE_URL}/hrv/daily/${from.toISODate()}/${to.toISODate()}`, hrvSchema, 'summary'),
      new DailyEndpoint(date => `${HRV_SERVICE_URL}/hrv/${date.toISODate()}`, hrvSchema, 'daily'),
    ],
  };
}
