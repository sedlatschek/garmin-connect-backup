import { Command } from 'commander';
import { DateTime } from 'luxon';
import { parseDate, parsePositiveFloat } from './parsers.js';
import { OUTPUT_DIR } from '../constants.js';

export { parseDate, parsePositiveFloat };

export interface BackupOptions {
  from: DateTime<true>
  to: DateTime<true>
  requestsPerSecond: number
  outputDir: string
}

const program = new Command();

program
  .name('garmin-connect-backup')
  .description('Backs up Garmin Connect data to local files')
  .requiredOption('--from <date>', 'Start date for backup (YYYY-MM-DD)', parseDate)
  .option('--to <date>', 'End date for backup (YYYY-MM-DD, default: today)', parseDate, DateTime.now().minus({ days: 1 }))
  .option('--requests-per-second <n>', 'Max Garmin API requests per second', parsePositiveFloat, 1)
  .option('--output-dir <path>', 'Directory to write backup files to', OUTPUT_DIR)
  .parse(process.argv);

const opts = program.opts();

export function getOptions(): BackupOptions {
  return {
    from: opts.from,
    to: opts.to,
    requestsPerSecond: opts.requestsPerSecond,
    outputDir: opts.outputDir,
  };
}
