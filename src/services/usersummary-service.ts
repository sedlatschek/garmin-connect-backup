import { z } from 'zod';
import { DateTime } from 'luxon';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../Service.js';
import { FourWeekEndpoint } from '../endpoint/FourWeekEndpoint.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';

const USERSUMMARY_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/usersummary-service`;

export function createUserSummaryService(userId: string): Service {
  const userSummaryDailySchema = z.looseObject({});
  const userSummaryStepsSchema = z.looseObject({});
  const userSummaryFloorsSchema = z.array(z.looseObject({}));
  const userSummaryIntensityMinutesSchema = z.array(z.looseObject({}));
  return {
    name: 'usersummary-service',
    endpoints: [
      new FourWeekEndpoint(
        (from, to) => `${USERSUMMARY_SERVICE_URL}/stats/daily/${from.toISODate()}/${to.toISODate()}?statsType=STEPS&currentDate=${DateTime.now().toISODate()}`,
        userSummaryStepsSchema,
        'steps',
      ),
      new FourWeekEndpoint((from, to) => `${USERSUMMARY_SERVICE_URL}/stats/floors/daily/${from.toISODate()}/${to.toISODate()}`, userSummaryFloorsSchema, 'floors'),
      new FourWeekEndpoint((from, to) => `${USERSUMMARY_SERVICE_URL}/stats/im/daily/${from.toISODate()}/${to.toISODate()}`, userSummaryIntensityMinutesSchema, 'intensityMinutes'),
      new DailyEndpoint(
        date => `${USERSUMMARY_SERVICE_URL}/usersummary/daily/${userId}/?calendarDate=${date.toISODate()}`,
        userSummaryDailySchema,
        'daily',
      ),
    ],
  };
}
