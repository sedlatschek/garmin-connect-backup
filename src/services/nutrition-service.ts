import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';
import { FourWeekEndpoint } from '../endpoint/FourWeekEndpoint.js';

const NUTRITION_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/nutrition-service`;

export function createNutritionService(): Service {
  const calorieSummarySchema = z.looseObject({});
  const foodLogsSchema = z.looseObject({});
  return {
    name: 'nutrition-service',
    endpoints: [
      new FourWeekEndpoint(
        (from, to) => `${NUTRITION_SERVICE_URL}/calorie/summary/daily/?startDate=${from.toISODate()}&endDate=${to.toISODate()}&isDataForReport=true`,
        calorieSummarySchema,
        'calorie_summary',
      ),
      new DailyEndpoint(
        date => `${NUTRITION_SERVICE_URL}/food/logs/${date.toISODate()}`,
        foodLogsSchema,
        'food_logs',
      ),
    ],
  };
}
