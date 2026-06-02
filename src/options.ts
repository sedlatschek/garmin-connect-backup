import { Command } from 'commander';
import { DateTime } from 'luxon';
import { parseDate, parsePositiveFloat } from './parsers.js';

export { parseDate, parsePositiveFloat };

export interface BackupOptions {
  from: string
  to: string
  requestsPerSecond: number
}

const program = new Command();

program
  .name('garmin-connect-backup')
  .description('Backs up Garmin Connect data to local files')
  .requiredOption('--from <date>', 'Start date for backup (YYYY-MM-DD)', parseDate)
  .option('--to <date>', 'End date for backup (YYYY-MM-DD, default: today)', parseDate, DateTime.now().toISODate())
  .option('--requests-per-second <n>', 'Max Garmin API requests per second', parsePositiveFloat, 1)
  .parse(process.argv);

const opts = program.opts();

export const options: BackupOptions = {
  from: opts.from,
  to: opts.to,
  requestsPerSecond: opts.requestsPerSecond,
};
