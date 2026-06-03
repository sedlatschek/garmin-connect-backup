import { z } from 'zod';
import { GarminConnectClient } from '../client/GarminConnectClient.js';
import { Endpoint } from './Endpoint.js';

export type PaginatedChunk<T> = {
  summaryFileName: string
  summaryData: T
  detailFileName: string
  detailUrl: string
  detailSchema: z.ZodTypeAny
} | {
  summaryFileName: string
  summaryData: T
  detailFileName?: never
  detailUrl?: never
  detailSchema?: never
};

type PaginatedEndpointOptions<T> = {
  listUrlBuilder: (start: number, limit: number) => string
  listSchema: z.ZodType<T[]>
  summaryFileNameBuilder: (item: T) => string
  pageSize?: number
  detail?: {
    urlBuilder: (item: T) => string
    schema: z.ZodTypeAny
    fileNameBuilder: (item: T) => string
  }
};

export class PaginatedEndpoint<T> implements Endpoint {
  // Required by Endpoint interface; the list schema is the relevant one here.
  readonly schema: z.ZodTypeAny;
  readonly fileName = '';

  private readonly listUrlBuilder: (start: number, limit: number) => string;
  private readonly listSchema: z.ZodType<T[]>;
  private readonly summaryFileNameBuilder: (item: T) => string;
  private readonly pageSize: number;
  private readonly detail?: {
    urlBuilder: (item: T) => string
    schema: z.ZodTypeAny
    fileNameBuilder: (item: T) => string
  };

  constructor(options: PaginatedEndpointOptions<T>) {
    this.listUrlBuilder = options.listUrlBuilder;
    this.listSchema = options.listSchema;
    this.schema = options.listSchema;
    this.summaryFileNameBuilder = options.summaryFileNameBuilder;
    this.pageSize = options.pageSize ?? 100;
    this.detail = options.detail;
  }

  async* chunks(client: GarminConnectClient): AsyncGenerator<PaginatedChunk<T>> {
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
