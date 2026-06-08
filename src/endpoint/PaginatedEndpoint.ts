import { z } from 'zod';
import { GarminConnectClient } from '../client/GarminConnectClient.js';
import { Endpoint } from './Endpoint.js';
import { DateTime } from 'luxon';
import { DEFAULT_PAGE_SIZE } from '../constants.js';

export type PaginatedChunk<T, D = unknown> = {
  summaryName: string
  summaryDate: DateTime<true>
  summaryData: T
  detailName: string
  detailUrl: string
  detailSchema: z.ZodType<D>
} | {
  summaryName: string
  summaryDate: DateTime<true>
  summaryData: T
  detailName?: never
  detailUrl?: never
  detailSchema?: never
};

type PaginatedEndpointOptions<T, D = T> = {
  name: string
  listUrlBuilder: (start: number, limit: number) => string
  listSchema: z.ZodType<T[]>
  summaryNameBuilder: (item: T) => string
  pageSize?: number
  dateExtractor: (item: T) => DateTime<true>
  detail?: {
    urlBuilder: (item: T) => string
    nameBuilder: (item: T) => string
    schema: z.ZodType<D>
  }
};

export class PaginatedEndpoint<T, D = T> implements Endpoint {
  readonly schema: z.ZodTypeAny;
  readonly name: string;
  readonly dateExtractor: (item: T) => DateTime<true>;

  private readonly listUrlBuilder: (start: number, limit: number) => string;
  private readonly listSchema: z.ZodType<T[]>;
  private readonly summaryNameBuilder: (item: T) => string;
  private readonly pageSize: number;
  private readonly detail?: {
    urlBuilder: (item: T) => string
    nameBuilder: (item: T) => string
    schema: z.ZodType<D>
  };

  constructor(options: PaginatedEndpointOptions<T, D>) {
    this.name = options.name;
    this.listUrlBuilder = options.listUrlBuilder;
    this.listSchema = options.listSchema;
    this.schema = options.listSchema;
    this.summaryNameBuilder = options.summaryNameBuilder;
    this.pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    this.dateExtractor = options.dateExtractor;
    this.detail = options.detail;
  }

  async* chunks(client: GarminConnectClient): AsyncGenerator<PaginatedChunk<T, D>> {
    let start = 0;
    while (true) {
      const page = await client.get(this.listUrlBuilder(start, this.pageSize), this.listSchema);
      for (const item of page) {
        const summaryName = this.summaryNameBuilder(item);
        const summaryDate = this.dateExtractor(item);
        if (this.detail) {
          yield {
            summaryName,
            summaryDate,
            summaryData: item,
            detailName: this.detail.nameBuilder(item),
            detailUrl: this.detail.urlBuilder(item),
            detailSchema: this.detail.schema,
          };
        } else {
          yield {
            summaryName,
            summaryDate,
            summaryData: item,
          };
        }
      }
      if (page.length < this.pageSize) break;
      start += this.pageSize;
    }
  }
}
