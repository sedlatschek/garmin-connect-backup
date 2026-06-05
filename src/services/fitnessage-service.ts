import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';

const FITNESS_AGE_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/fitnessage-service`;

export function createFitnessAgeService(): Service {
  const fitnessAgeSchema = z.looseObject({});
  return {
    name: 'fitnessage-service',
    endpoints: [
      new DailyEndpoint(date => `${FITNESS_AGE_SERVICE_URL}/fitnessage/${date.toISODate()}`, fitnessAgeSchema, 'fitnessage'),
    ],
  };
}
