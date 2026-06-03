import { Logger } from './Logger.js';

const reset = '\x1b[0m';
const bold = '\x1b[1m';
const bgYellow = '\x1b[43m';
const bgBlue = '\x1b[44m';
const bgGreen = '\x1b[42m';
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

  public skip(fileName: string, reason: 'already exists'): void {
    console.info(`${bold}${bgYellow}${fgBlack}[SKIP]${reset}  ${fileName} (${reason})`);
  }

  public fetch(url: string): void {
    console.info(`${bold}${bgBlue}${fgWhite}[FETCH]${reset} ${url}`);
  }

  public output(fileName: string): void {
    console.info(`${bold}${bgGreen}${fgWhite}[WRITE]${reset} ${fileName}`);
  }
}
