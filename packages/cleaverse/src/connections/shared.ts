import type { SignedMessage } from '../types.ts'

export const parseTextIntoSignedMessage = (text: string): SignedMessage | null => {
  let json: {
    event?: string
    signature?: string
    from?: string
    id?: number
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
    typeof json.event !== 'string' ||
    typeof json.signature !== 'string' ||
    typeof json.from !== 'string' ||
    typeof json.id !== 'string'
  ) {
    return null
  }

  return {
    event: json.event,
    signature: json.signature,
    from: json.from,
    id: json.id
  }
}
