import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import { Command } from 'commander';
import { DateTime } from 'luxon';
import yaml from 'js-yaml';
import { parseDate, parsePositiveFloat } from './parsers.js';
import { configFileSchema, type BackupOptions, type ConfigFile } from './schema.js';
import { OUTPUT_DIR } from '../constants.js';
import { GarminConnectBackupError } from '../error/GarminConnectBackupError.js';

export { parseDate, parsePositiveFloat };
export type { BackupOptions };

const program = new Command();

program
  .name('garmin-connect-backup')
  .description('Backs up Garmin Connect data to local files')
  .option('--config <path>', 'Path to YAML/YML configuration file')
  .option('--from <date>', 'Start date for backup (YYYY-MM-DD)', parseDate)
  .option('--to <date>', 'End date for backup (YYYY-MM-DD, default: today)', parseDate)
  .option('--requests-per-second <n>', 'Max Garmin API requests per second', parsePositiveFloat)
  .option('--output-dir <path>', 'Directory to write backup files to')
  .option('--username <email>', 'Garmin Connect username / email')
  .option('--password <password>', 'Garmin Connect password')
  .option('--services <names>', 'Comma-separated list of services to back up (default: all)')
  .parse(process.argv);

const opts = program.opts();

function loadConfigFile(path: string): ConfigFile {
  let raw: unknown;
  try {
    raw = yaml.load(readFileSync(path, 'utf-8'));
  } catch (e) {
    throw new GarminConnectBackupError(`Failed to read config file "${path}": ${e instanceof Error ? e.message : e}`);
  }
  const result = configFileSchema.safeParse(raw);
  if (!result.success) {
    throw new GarminConnectBackupError(`Invalid config file "${path}": ${result.error.message}`);
  }
  return result.data;
}

function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function promptPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const rlAny = rl as unknown as Record<string, unknown>;
    rlAny['_writeToOutput'] = (str: string) => {
      if (str === question) process.stdout.write(str);
    };
    rl.question(question, (answer) => {
      process.stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

export async function getOptions(): Promise<BackupOptions> {
  const config: ConfigFile = opts.config ? loadConfigFile(opts.config) : {};

  const from = opts.from ?? config.from;
  if (!from) {
    throw new GarminConnectBackupError('--from is required (or set "from" in the config file)');
  }

  const username = opts.username
    ?? config.username
    ?? process.env.GARMIN_USERNAME
    ?? await prompt('Garmin username (email): ');

  const password = opts.password
    ?? config.password
    ?? process.env.GARMIN_PASSWORD
    ?? await promptPassword('Garmin password: ');

  const cliServices: string[] | undefined = typeof opts.services === 'string'
    ? opts.services.split(',').map(s => s.trim()).filter(Boolean)
    : undefined;

  return {
    from,
    to: opts.to ?? config.to ?? DateTime.now().minus({ days: 1 }),
    requestsPerSecond: opts.requestsPerSecond ?? config.requestsPerSecond ?? 1,
    outputDir: opts.outputDir ?? config.outputDir ?? OUTPUT_DIR,
    username,
    password,
    services: cliServices ?? config.services,
  };
}
