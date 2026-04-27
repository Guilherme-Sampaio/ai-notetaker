const EXT_TO_MIME: Record<string, string> = {
  wav: 'audio/wav',
  mp4: 'audio/mp4',
  mp3: 'audio/mpeg',
  webm: 'audio/webm',
}

export function mimeTypeFromKey(key: string): string {
  const ext = key.split('.').pop() ?? ''
  return EXT_TO_MIME[ext] ?? 'audio/webm'
}
