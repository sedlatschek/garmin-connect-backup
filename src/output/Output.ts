import { DateTime } from 'luxon';
import { Service } from '../types/Service.js';
import { Endpoint } from '../endpoint/Endpoint.js';

type OutputDateRange = {
  from: DateTime<true>
  to: DateTime<true>
};

export function isOutputDateRange(value: unknown): value is OutputDateRange {
  return typeof value === 'object'
    && value !== null
    && 'from' in value
    && 'to' in value
    && DateTime.isDateTime(value.from)
    && DateTime.isDateTime(value.to)
    && value.from.isValid
    && value.to.isValid;
}

type OutputDate = {
  date: DateTime<true>
};

export function isOutputDate(value: unknown): value is OutputDate {
  return typeof value === 'object'
    && value !== null
    && 'date' in value
    && DateTime.isDateTime(value.date)
    && value.date.isValid;
}

export type OutputTiming = OutputDate | OutputDateRange;

export type Output = {
  service: Service
  endpoint: Endpoint
} & OutputTiming;

export type OutputWithContent = Output & {
  content: string
};
