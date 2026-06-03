import { join, dirname, resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { Output } from './Output.js';
import { exists } from '../helpers.js';
import { Logger } from '../logger/Logger.js';

export type LocalFileOutputOptions = {
  logger: Logger
  outputDir: string
};

export class LocalFileOutput implements Output {
  constructor(private readonly options: LocalFileOutputOptions) {}

  public async add(file: string, content: string): Promise<void> {
    this.options.logger.output(resolve(file));

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
