import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';

const BLOODPRESSURE_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/bloodpressure-service`;

export function createBloodPressureService(): Service {
  const bloodPressureSchema = z.looseObject({});
  return {
    name: 'bloodpressure-service',
    endpoints: [
      new DailyEndpoint(date => `${BLOODPRESSURE_SERVICE_URL}/bloodpressure/dayview/${date.toISODate()}`, bloodPressureSchema, 'daily'),
    ],
  };
}
