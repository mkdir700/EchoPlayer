declare module 'subsrt' {
  const mod: {
    detect: (s: string) => string
    parse: (
      s: string,
      opts?: { format?: string }
    ) => Array<{ start: number; end: number; text: string }>
    build: (cues: any[], opts?: { format?: string }) => string
  }
  export default mod
}
