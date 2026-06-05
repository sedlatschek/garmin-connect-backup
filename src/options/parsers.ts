import { DateTime } from 'luxon';
import { GarminConnectBackupError } from '../error/GarminConnectBackupError.js';

export function parseDate(value: string): DateTime<true> {
  const dateTime = DateTime.fromISO(value, { zone: 'local' });
  dateTime.setZone('utc');
  if (!dateTime.isValid) {
    throw new GarminConnectBackupError(`Invalid date "${value}": ${dateTime.invalidExplanation}`);
  }
  return dateTime;
}

export function parsePositiveFloat(value: string): number {
  const float = parseFloat(value);
  if (isNaN(float) || float <= 0) {
    throw new GarminConnectBackupError(`Invalid requestsPerSecond "${value}" — must be a positive number`);
  }
  return float;
}
