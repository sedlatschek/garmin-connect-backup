export interface Logger {
  service: (service: string) => void
  skip: (fileName: string, reason: 'already exists') => void
  fetch: (url: string) => void
  output: (fileName: string) => void
}
