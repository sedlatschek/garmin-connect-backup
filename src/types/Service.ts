import { Endpoint } from '../endpoint/Endpoint.js';

export type Service = {
  readonly name: string
  readonly endpoints: Endpoint[]
};
