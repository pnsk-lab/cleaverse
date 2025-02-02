import type { CleaverseEvent } from './events.ts'

export interface SignedMessage {
  event: string
  signature: string
  from: string
  id: string
}
export interface UncompressedMessage extends SignedMessage {
  uncompressed: CleaverseEvent
}
export type Pos = [x: number, y: number]
