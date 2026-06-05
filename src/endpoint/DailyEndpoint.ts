import { z } from 'zod';
import { DateTime } from 'luxon';
import { Endpoint } from './Endpoint.js';

export class DailyEndpoint implements Endpoint {
  readonly schema: z.ZodTypeAny;
  readonly name: string;
  private readonly urlBuilder: (date: DateTime<true>) => string;

  constructor(
    urlBuilder: (date: DateTime<true>) => string,
    schema: z.ZodTypeAny,
    name: string,
  ) {
    this.urlBuilder = urlBuilder;
    this.schema = schema;
    this.name = name;
  }

  public* chunk(start: DateTime<true>, end: DateTime<true>): Generator<{ date: DateTime<true>, url: string }> {
    let current = start.startOf('day');
    while (current <= end) {
      const url = this.urlBuilder(current);
      yield { date: current, url };
      current = current.plus({ days: 1 });
    }
  }
}
