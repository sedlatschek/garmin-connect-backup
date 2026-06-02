import { Serializer } from './Serializer.js';

export type JsonSerializerOptions = {
  indent?: number
};

export class JsonSerializer implements Serializer {
  constructor(private readonly options: JsonSerializerOptions = {}) {}

  serialize(data: unknown): string {
    return JSON.stringify(data, null, this.options.indent ?? 2);
  }
}
