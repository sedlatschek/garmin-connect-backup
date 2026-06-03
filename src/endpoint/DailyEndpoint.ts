import { z } from 'zod';
import { DateTime } from 'luxon';
import { Endpoint } from './Endpoint.js';

export class DailyEndpoint implements Endpoint {
  readonly schema: z.ZodTypeAny;
  readonly fileName: string;
  private readonly urlBuilder: (date: DateTime<true>) => string;

  constructor(
    urlBuilder: (date: DateTime<true>) => string,
    schema: z.ZodTypeAny,
    fileName: string,
  ) {
    this.urlBuilder = urlBuilder;
    this.schema = schema;
    this.fileName = fileName;
  }

  public* chunk(start: DateTime<true>, end: DateTime<true>): Generator<{ date: DateTime<true>, fileName: string, url: string }> {
    let current = start.startOf('day');
    while (current <= end) {
      const fileName = `${this.fileName}_${current.toISODate()}.json`;
      const url = this.urlBuilder(current);
      yield { date: current, fileName, url };
      current = current.plus({ days: 1 });
    }
  }
}
