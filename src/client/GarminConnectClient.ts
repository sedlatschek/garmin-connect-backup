import { z } from 'zod';

export interface GarminConnectClient {
  get<T extends z.ZodTypeAny>(url: string, schema: T): Promise<z.output<T>>
  getDisplayName(): Promise<string>
  close(): Promise<void>
}
