import { DateTime } from 'luxon';

export function parseDate(value: string): DateTime<true> {
  const dateTime = DateTime.fromISO(value, { zone: 'local' });
  dateTime.setZone('utc');
  if (!dateTime.isValid) {
    throw new Error(`Invalid date "${value}": ${dateTime.invalidExplanation}`);
  }
  return dateTime;
}

export function parsePositiveFloat(value: string): number {
  const float = parseFloat(value);
  if (isNaN(float) || float <= 0) {
    throw new Error(`Invalid requestsPerSecond "${value}" — must be a positive number`);
  }
  return float;
}
