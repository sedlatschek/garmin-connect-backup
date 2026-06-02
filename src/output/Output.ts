export interface Output {
  add(file: string, content: string): Promise<void>
}
