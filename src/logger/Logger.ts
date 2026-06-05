import { Output, OutputWithContent } from '../output/Output.js';

export interface Logger {
  service: (service: string) => void
  fetch: (url: string) => void
  output: (output: OutputWithContent) => void
  skip: (output: Output, reason: 'already exists') => void
  error: (output: Output, error: unknown) => void
}
