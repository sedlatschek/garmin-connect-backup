import { z } from 'zod';
import { DateTime } from 'luxon';
import { Endpoint } from './Endpoint.js';
import { CHUNK_ANCHOR } from '../constants.js';

export class FourWeekEndpoint implements Endpoint {
  readonly schema: z.ZodTypeAny;
  readonly name: string;
  private readonly urlBuilder: (from: DateTime<true>, to: DateTime<true>) => string;

  constructor(
    urlBuilder: (from: DateTime<true>, to: DateTime<true>) => string,
    schema: z.ZodTypeAny,
    name: string,
  ) {
    this.urlBuilder = urlBuilder;
    this.schema = schema;
    this.name = name;
  }

  public* chunk(
    start: DateTime<true>,
    end: DateTime<true>,
  ): Generator<{ from: DateTime<true>, to: DateTime<true>, complete: boolean, url: string }> {
    const firstIndex = Math.floor(CHUNK_ANCHOR.until(start).toDuration('days').days / 28);
    const lastIndex = Math.floor(CHUNK_ANCHOR.until(end).toDuration('days').days / 28);

    for (let i = firstIndex; i <= lastIndex; i++) {
      const from = DateTime.max(CHUNK_ANCHOR.plus({ days: i * 28 }), start) as DateTime<true>;
      const to = DateTime.min(CHUNK_ANCHOR.plus({ days: i * 28 + 27 }), end) as DateTime<true>;
      const complete = to < DateTime.now();
      const url = this.urlBuilder(from, to);
      yield { from, to, complete, url };
    }
  }
}
