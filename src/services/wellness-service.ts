import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';

const WELLNESS_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/wellness-service`;

export function createWellnessService(userId: string): Service {
  const objectSchema = z.looseObject({});
  const arraySchema = z.array(z.looseObject({}));
  return {
    name: 'wellness-service',
    endpoints: [
      new DailyEndpoint(date => `${WELLNESS_SERVICE_URL}/wellness/daily/spo2acclimation/${date.toISODate()}`, objectSchema, 'spo2acclimation'),
      new DailyEndpoint(date => `${WELLNESS_SERVICE_URL}/wellness/daily/respiration/${date.toISODate()}`, objectSchema, 'respiration'),
      new DailyEndpoint(date => `${WELLNESS_SERVICE_URL}/wellness/dailySleepData/${userId}?date=${date.toISODate()}`, objectSchema, 'sleep'),
      new DailyEndpoint(date => `${WELLNESS_SERVICE_URL}/wellness/dailyEvents/${userId}?calendarDate=${date.toISODate()}`, arraySchema, 'events'),
      new DailyEndpoint(date => `${WELLNESS_SERVICE_URL}/wellness/dailyStress/${date.toISODate()}`, objectSchema, 'stress'),
      new DailyEndpoint(date => `${WELLNESS_SERVICE_URL}/wellness/bodyBattery/events/${date.toISODate()}`, arraySchema, 'body_battery_events'),
    ],
  };
}
