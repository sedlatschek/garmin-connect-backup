import { Endpoint } from './endpoint/Endpoint.js';

export interface Service {
  readonly name: string
  readonly endpoints: Endpoint[]
}
