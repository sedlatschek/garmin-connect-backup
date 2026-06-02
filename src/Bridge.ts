import { Output } from './output/Output.js';
import { Serializer } from './serializer/Serializer.js';

export class Bridge {
  constructor(private readonly output: Output, private readonly serializer: Serializer) {}

  public async add(file: string, content: object): Promise<void> {
    const serializedContent = this.serializer.serialize(content);
    return this.output.add(file, serializedContent);
  }

  public async exists(file: string): Promise<boolean> {
    return this.output.exists(file);
  }
}
