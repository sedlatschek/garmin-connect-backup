import { z } from 'zod';
import { DateTime } from 'luxon';
import { Endpoint } from './Endpoint.js';
import { CHUNK_ANCHOR } from '../constants.js';

export class MultiDayEndpoint implements Endpoint {
  readonly schema: z.ZodTypeAny;
  readonly name: string;
  private readonly days: number;
  protected readonly urlBuilder: (from: DateTime<true>, to: DateTime<true>) => string;

  constructor(
    days: number,
    urlBuilder: (from: DateTime<true>, to: DateTime<true>) => string,
    schema: z.ZodTypeAny,
    name: string,
  ) {
    this.days = days;
    this.urlBuilder = urlBuilder;
    this.schema = schema;
    this.name = name;
  }

  public* chunk(
    start: DateTime<true>,
    end: DateTime<true>,
  ): Generator<{ from: DateTime<true>, to: DateTime<true>, complete: boolean, url: string }> {
    const firstIndex = Math.floor(CHUNK_ANCHOR.until(start).toDuration('days').days / this.days);
    const lastIndex = Math.floor(CHUNK_ANCHOR.until(end).toDuration('days').days / this.days);

    for (let i = firstIndex; i <= lastIndex; i++) {
      const from = DateTime.max(CHUNK_ANCHOR.plus({ days: i * this.days }), start);
      const to = DateTime.min(CHUNK_ANCHOR.plus({ days: i * this.days + this.days - 1 }), end);
      const complete = to < DateTime.now();
      const url = this.urlBuilder(from, to);
      yield { from, to, complete, url };
    }
  }
}
