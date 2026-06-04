import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { FourWeekEndpoint } from '../endpoint/FourWeekEndpoint.js';

const GOAL_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/goal-service`;

export function createGoalService(): Service {
  const goalSchema = z.looseObject({});
  return {
    name: 'goal-service',
    endpoints: [
      new FourWeekEndpoint((from, to) => `${GOAL_SERVICE_URL}/goal/user/effective/weightgoal/${from.toISODate()}/${to.toISODate()}`, goalSchema, 'weightgoal'),
    ],
  };
}
