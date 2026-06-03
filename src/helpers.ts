import { DateTime } from 'luxon';
import { stat } from 'node:fs/promises';

export async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Garmin expects a total of 28 days in each chunk.
 */
export function* fourWeekChunks(start: DateTime<true>, end: DateTime<true>): Generator<{ from: DateTime, to: DateTime }> {
  let currentStart = start;
  while (currentStart < end) {
    const currentEnd = DateTime.min(currentStart.plus({ days: 27 }), end);
    yield { from: currentStart, to: currentEnd };
    currentStart = currentEnd;
  }
}

export function* monthlyChunks(start: DateTime<true>, end: DateTime<true>): Generator<{ from: DateTime, to: DateTime }> {
  let currentStart = start.startOf('month');
  while (currentStart < end) {
    const currentEnd = DateTime.min(currentStart.endOf('month'), end);
    yield { from: currentStart, to: currentEnd };
    currentStart = currentStart.plus({ months: 1 });
  }
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
