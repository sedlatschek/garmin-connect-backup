import { DateTime } from 'luxon';
import { stat } from 'node:fs/promises';
import { CHUNK_ANCHOR } from './constants.js';

export async function exists(file: string): Promise<boolean> {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

/**
 * Yields fixed 28-day chunks anchored to CHUNK_ANCHOR so that chunk boundaries
 * are always identical regardless of the start/end arguments passed in.
 * This guarantees that every chunk maps to exactly one filename forever, and
 * a completed chunk is never re-downloaded across backup runs.
 *
 * `complete` is false for the chunk that contains today — that chunk must
 * always be re-fetched because more data may have arrived since the last run.
 */
export function* fourWeekChunks(
  start: DateTime<true>,
  end: DateTime<true>,
): Generator<{ from: DateTime<true>, to: DateTime<true>, complete: boolean }> {
  const firstIndex = Math.floor(CHUNK_ANCHOR.until(start).toDuration('days').days / 28);
  const lastIndex = Math.floor(CHUNK_ANCHOR.until(end).toDuration('days').days / 28);

  for (let i = firstIndex; i <= lastIndex; i++) {
    const from = DateTime.max(CHUNK_ANCHOR.plus({ days: i * 28 }), start) as DateTime<true>;
    const to = DateTime.min(CHUNK_ANCHOR.plus({ days: i * 28 + 27 }), end) as DateTime<true>;
    const complete = to < DateTime.now();
    yield { from, to, complete };
  }
}

export function* monthlyChunks(start: DateTime<true>, end: DateTime<true>): Generator<{ from: DateTime<true>, to: DateTime<true> }> {
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
