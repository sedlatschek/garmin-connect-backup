import { DateTime } from 'luxon';
import { stat } from 'node:fs/promises';
import { GarminConnectBackupError } from './error/GarminConnectBackupError.js';

export async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function dateTimeFromIso(iso: string): DateTime<true> {
  const dateTime = DateTime.fromISO(iso);
  if (!dateTime.isValid) {
    throw new GarminConnectBackupError(`Invalid ISO date string ${iso}`);
  }
  return dateTime;
}

export function dateTimeFromGarminGmt(garminGmt: string): DateTime<true> {
  return dateTimeFromIso(`${garminGmt.replace(' ', 'T')}Z`);
}
