import { DateTime } from 'luxon';

export function parseDate(value: string): string {
  const dateTime = DateTime.fromISO(value, { zone: 'local' });
  if (!dateTime.isValid) {
    throw new Error(`Invalid date "${value}": ${dateTime.invalidExplanation}`);
  }
  return dateTime.toISODate();
}

export function parsePositiveFloat(value: string): number {
  const float = parseFloat(value);
  if (isNaN(float) || float <= 0) {
    throw new Error(`Invalid requestsPerSecond "${value}" — must be a positive number`);
  }
  return float;
}
