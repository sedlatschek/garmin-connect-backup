import { z } from 'zod';
import { GarminConnectClient } from '../client/GarminConnectClient.js';
import { Endpoint } from './Endpoint.js';
import { DateTime } from 'luxon';
import { DEFAULT_PAGE_SIZE } from '../constants.js';

export type PaginatedChunk<T, D = unknown> = {
  summaryFileName: string
  summaryData: T
  detailFileName: string
  detailUrl: string
  detailSchema: z.ZodType<D>
  detailDateExtractor?: (detail: D) => DateTime<true>
} | {
  summaryFileName: string
  summaryData: T
  detailFileName?: never
  detailUrl?: never
  detailSchema?: never
  detailDateExtractor?: never
};

type PaginatedEndpointOptions<T, D = T> = {
  listUrlBuilder: (start: number, limit: number) => string
  listSchema: z.ZodType<T[]>
  summaryFileNameBuilder: (item: T) => string
  pageSize?: number
  dateExtractor: (item: T) => DateTime<true>
  detail?: {
    urlBuilder: (item: T) => string
    schema: z.ZodType<D>
    fileNameBuilder: (item: T) => string
    dateExtractor?: (detail: D) => DateTime<true>
  }
};

export class PaginatedEndpoint<T, D = T> implements Endpoint {
  // Required by Endpoint interface; the list schema is the relevant one here.
  readonly schema: z.ZodTypeAny;
  readonly fileName = '';
  readonly dateExtractor: (item: T) => DateTime<true>;

  private readonly listUrlBuilder: (start: number, limit: number) => string;
  private readonly listSchema: z.ZodType<T[]>;
  private readonly summaryFileNameBuilder: (item: T) => string;
  private readonly pageSize: number;
  private readonly detail?: {
    urlBuilder: (item: T) => string
    schema: z.ZodType<D>
    fileNameBuilder: (item: T) => string
    dateExtractor?: (detail: D) => DateTime<true>
  };

  constructor(options: PaginatedEndpointOptions<T, D>) {
    this.listUrlBuilder = options.listUrlBuilder;
    this.listSchema = options.listSchema;
    this.schema = options.listSchema;
    this.summaryFileNameBuilder = options.summaryFileNameBuilder;
    this.pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    this.dateExtractor = options.dateExtractor;
    this.detail = options.detail;
  }

  async* chunks(client: GarminConnectClient): AsyncGenerator<PaginatedChunk<T, D>> {
    let start = 0;
    while (true) {
      const page = await client.get(this.listUrlBuilder(start, this.pageSize), this.listSchema);
      for (const item of page) {
        if (this.detail) {
          yield {
            summaryFileName: this.summaryFileNameBuilder(item),
            summaryData: item,
            detailFileName: this.detail.fileNameBuilder(item),
            detailUrl: this.detail.urlBuilder(item),
            detailSchema: this.detail.schema,
            detailDateExtractor: this.detail.dateExtractor,
          };
        } else {
          yield {
            summaryFileName: this.summaryFileNameBuilder(item),
            summaryData: item,
          };
        }
      }
      if (page.length < this.pageSize) break;
      start += this.pageSize;
    }
  }
}
