import { z } from 'zod';
import { Endpoint } from './Endpoint.js';

export class LiveEndpoint implements Endpoint {
  readonly schema: z.ZodTypeAny;
  readonly name: string;
  readonly url: string;

  constructor(url: string, schema: z.ZodTypeAny, name: string) {
    this.url = url;
    this.schema = schema;
    this.name = name;
  }
}
