import { serializeError } from 'serialize-error';
import { isOutputDate, Output, OutputWithContent } from '../output/Output.js';
import { Logger } from './Logger.js';

const reset = '\x1b[0m';
const bold = '\x1b[1m';
const bgYellow = '\x1b[43m';
const bgBlue = '\x1b[44m';
const bgGreen = '\x1b[42m';
const bgRed = '\x1b[41m';
const fgBlack = '\x1b[30m';
const fgWhite = '\x1b[37m';

const separatorChar = '#';
const lineWidth = Math.max(process.stdout.columns ?? 50, 50);

export class ConsoleLogger implements Logger {
  public service(service: string): void {
    const separatorLine = separatorChar.repeat(lineWidth);
    const label = service.toUpperCase();
    const visibleLength = 2 + label.length + 1;
    const mainLine = `${separatorChar} ${reset}${label}${bold} ${separatorChar.repeat(lineWidth - visibleLength)}`;
    console.info(`\n${bold}${separatorLine}\n${mainLine}\n${separatorLine}`);
  }

  public fetch(url: string): void {
    console.info(`${bold}${bgBlue}${fgWhite}[FETCH]${reset} ${url}`);
  }

  public output(output: OutputWithContent): void {
    console.info(`${bold}${bgGreen}${fgWhite}[WRITE]${reset} ${this.getOutputString(output)}`);
  }

  public skip(output: Output, reason: 'already exists'): void {
    console.info(`${bold}${bgYellow}${fgBlack}[SKIP]${reset} ${this.getOutputString(output)} (${reason})`);
  }

  public error(output: Output, error: unknown): void {
    console.error(`${bold}${bgRed}${fgWhite}[ERROR]${reset} ${this.getOutputString(output)}: ${serializeError(error)}`);
  }

  private getOutputString(output: Output): string {
    return `${output.service.name}/${output.endpoint.name}: ${this.getTimestampString(output)}`;
  }

  private getTimestampString(output: Output): string {
    if (isOutputDate(output)) {
      return output.date.toISODate()!;
    } else {
      return `${output.from.toISODate()} => ${output.to.toISODate()}`;
    }
  }
}
