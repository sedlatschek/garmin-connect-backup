import { join, dirname } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { isOutputDate, Output, OutputWithContent } from './Output.js';
import { exists } from '../helpers.js';
import { Logger } from '../logger/Logger.js';
import { OutputCreator } from './OutputCreator.js';

export type LocalFileOutputCreatorOptions = {
  logger: Logger
  outputDir: string
};

export class LocalFileOutputCreator implements OutputCreator {
  constructor(private readonly options: LocalFileOutputCreatorOptions) {}

  public async add(output: OutputWithContent): Promise<void> {
    const path = join(this.options.outputDir, this.getFilePath(output));
    this.options.logger.output(output);

    const dir = dirname(path);
    if (!await exists(dir)) {
      await mkdir(dir, { recursive: true });
    }
    return writeFile(path, output.content);
  }

  public async outputExists(options: Output): Promise<boolean> {
    const path = join(this.options.outputDir, this.getFilePath(options));
    return exists(path);
  }

  private getFilePath(output: Output): string {
    return join(output.service.name, `${output.endpoint.name}_${this.getTimestampString(output)}.json`);
  }

  private getTimestampString(output: Output): string {
    if (isOutputDate(output)) {
      return output.date.toISODate()!;
    } else {
      return `${output.from.toISODate()}_${output.to.toISODate()}`;
    }
  }
}
