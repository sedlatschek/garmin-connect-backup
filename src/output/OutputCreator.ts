import { Output, OutputWithContent } from './Output.js';

export interface OutputCreator {
  add(output: OutputWithContent): Promise<void>
  outputExists(output: Output): Promise<boolean>
}
