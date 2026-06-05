import { Output, OutputWithContent } from '../output/Output.js';

export interface Logger {
  service: (service: string) => void
  skip: (output: Output, reason: 'already exists') => void
  fetch: (url: string) => void
  output: (output: OutputWithContent) => void
}
