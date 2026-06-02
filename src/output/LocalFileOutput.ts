import { join, dirname } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { Output } from './Output.js';
import { exists } from '../helpers.js';

export type LocalFileOutputOptions = {
  outputDir: string
};

export class LocalFileOutput implements Output {
  constructor(private readonly options: LocalFileOutputOptions) {}

  public async add(file: string, content: string): Promise<void> {
    console.log('file', file);

    const dir = dirname(join(this.options.outputDir, file));
    if (!await exists(dir)) {
      await mkdir(dir, { recursive: true });
    }
    const path = join(this.options.outputDir, file);
    return writeFile(path, content);
  }

  public async exists(file: string): Promise<boolean> {
    const path = join(this.options.outputDir, file);
    return exists(path);
  }
}
