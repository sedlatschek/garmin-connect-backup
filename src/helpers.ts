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

export function* monthlyChunks(start: DateTime<true>, end: DateTime<true>): Generator<{ from: DateTime, to: DateTime }> {
  let currentStart = start.startOf('month');
  while (currentStart < end) {
    const currentEnd = DateTime.min(currentStart.endOf('month'), end);
    yield { from: currentStart, to: currentEnd };
    currentStart = currentStart.plus({ months: 1 });
  }
}
