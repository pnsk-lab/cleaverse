import type { SignedMessage } from '../types.ts'

export const parseTextIntoSignedMessage = (text: string): SignedMessage | null => {
  let json: {
    json?: string
    signature?: string
    from?: string
  } | null
  try {
    json = JSON.parse(text)
  } catch {
    return null
  }
  if (typeof json !== 'object' || json === null) {
    return null
  }
  if (
    typeof json.json !== 'string' ||
    typeof json.signature !== 'string' ||
    typeof json.from !== 'string'
  ) {
    return null
  }

  return {
    json: json.json,
    signature: json.signature,
    from: json.from,
  }
}
