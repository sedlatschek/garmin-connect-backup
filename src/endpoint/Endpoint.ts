import { z } from 'zod';

export interface Endpoint {
  readonly schema: z.ZodTypeAny
  readonly name: string
}
