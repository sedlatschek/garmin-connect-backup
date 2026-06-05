import { z } from 'zod';
import { GARMIN_CONNECT_API_URL } from '../constants.js';
import { Service } from '../types/Service.js';
import { DailyEndpoint } from '../endpoint/DailyEndpoint.js';
import { MultiDayEndpoint } from '../endpoint/MultiDayEndpoint.js';

const METRICS_SERVICE_URL = `${GARMIN_CONNECT_API_URL}/metrics-service`;

export function createMetricsService(): Service {
  const schema = z.looseObject({});
  return {
    name: 'metrics-service',
    endpoints: [
      new DailyEndpoint(
        date => `${METRICS_SERVICE_URL}/metrics/trainingloadbalance/latest/${date.toISODate()}`,
        schema,
        'trainingloadbalance',
      ),
      new DailyEndpoint(
        date => `${METRICS_SERVICE_URL}/metrics/maxmet/latest/${date.toISODate()}`,
        schema,
        'maxmet',
      ),
      new DailyEndpoint(
        date => `${METRICS_SERVICE_URL}/metrics/heataltitudeacclimation/latest/${date.toISODate()}`,
        schema,
        'heataltitudeacclimation',
      ),
      new DailyEndpoint(
        date => `${METRICS_SERVICE_URL}/metrics/trainingstatus/daily/${date.toISODate()}`,
        schema,
        'trainingstatus',
      ),
      new MultiDayEndpoint(
        365,
        (from, to) => `${METRICS_SERVICE_URL}/metrics/endurancescore/stats?startDate=${from.toISODate()}&endDate=${to.toISODate()}&aggregation=monthly`,
        schema,
        'endurance_score_monthly',
      ),
      new MultiDayEndpoint(
        365,
        (from, to) => `${METRICS_SERVICE_URL}/metrics/endurancescore/stats?startDate=${from.toISODate()}&endDate=${to.toISODate()}&aggregation=weekly`,
        schema,
        'endurance_score_weekly',
      ),
    ],
  };
}
