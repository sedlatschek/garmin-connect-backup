import { z } from 'zod';
import { DateTime } from 'luxon';
import { MultiDayEndpoint } from './MultiDayEndpoint.js';

export class FourWeekEndpoint extends MultiDayEndpoint {
  constructor(
    urlBuilder: (from: DateTime<true>, to: DateTime<true>) => string,
    schema: z.ZodTypeAny,
    name: string,
  ) {
    super(28, urlBuilder, schema, name);
  }
}
