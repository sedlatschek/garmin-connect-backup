import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../Service.js';
import { FourWeekEndpoint } from '../endpoint/FourWeekEndpoint.js';

const HEALTHSTATUS_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/healthstatus-service`;

export function createHealthStatusService(): Service {
  const healthStatusSchema = z.array(z.looseObject({}));
  return {
    name: 'healthstatus-service',
    endpoints: [
      new FourWeekEndpoint((from, to) => `${HEALTHSTATUS_SERVICE_URL}/healthstatus/summary/${from.toISODate()}/${to.toISODate()}`, healthStatusSchema, 'summary'),
    ],
  };
}
