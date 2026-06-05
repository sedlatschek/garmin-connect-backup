import { z } from 'zod';
import { DateTime } from 'luxon';
import { parseDate, parsePositiveFloat } from './parsers.js';

const dateField = z.string().transform(parseDate);
const positiveFloatField = z.union([
  z.number().positive(),
  z.string().transform(parsePositiveFloat),
]);

export const configFileSchema = z.object({
  from: dateField.optional(),
  to: dateField.optional(),
  requestsPerSecond: positiveFloatField.optional(),
  outputDir: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

export type ConfigFile = z.output<typeof configFileSchema>;

export type BackupOptions = {
  from: DateTime<true>
  to: DateTime<true>
  requestsPerSecond: number
  outputDir: string
  username: string
  password: string
};
