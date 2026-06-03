import { DateTime } from 'luxon';

export const GARMIN_CONNECT_API_URL = 'https://connect.garmin.com/gc-api';
export const DEFAULT_PAGE_SIZE = 100;
export const OUTPUT_DIR = './backup';

/**
 * Fixed anchor for interval chunk calculations. All chunk boundaries are derived
 * from this date, so they remain identical regardless of the --from/--to flags.
 * Must predate any possible Garmin Connect data.
 */
export const CHUNK_ANCHOR = ((): DateTime<true> => {
  const dateTime = DateTime.fromISO('2000-01-01', { zone: 'utc' });
  if (dateTime.isValid) {
    return dateTime;
  }
  throw new Error('Invalid CHUNK_ANCHOR date');
})();
