/**
 * Transport Layer
 * @module
 */

import { parseTextIntoSignedMessage } from './connections/shared.ts'
import type { SignedMessage, UncompressedMessage } from './types.ts'

interface EventMap {
  message: MessageEvent<UncompressedMessage>
  close: Event
}

export type ConnectionReadyState = 'OPEN' | 'CLOSED'
/**
 * Connection
 */
export abstract class Connection extends EventTarget {
  abstract send(message: SignedMessage): Promise<void>
  abstract close(): Promise<void>

  abstract readyState: ConnectionReadyState

  receiveJSON (json: string) {
    const parsed = parseTextIntoSignedMessage(json)
    if (!parsed) {
      return
    }
    const uncompressed: UncompressedMessage = {
      uncompressed: JSON.parse(parsed.event),
      ...parsed
    }
    this.dispatchEvent(new MessageEvent('message', { data: uncompressed }))
  }

  override addEventListener<T extends keyof EventMap>(type: T , listener: (ev: EventMap[T]) => void): void {
    super.addEventListener(type, listener as EventListener)
  }
}

export class Transport extends EventTarget {
  #connections: Set<Connection>
  constructor() {
    super()
    this.#connections = new Set()
  }

  /**
   * Adds a connection to the transport and sets up a message event listener.
   * When a message event is received from the connection, it is dispatched
   * to the transport's event listeners.
   *
   * @param connection - The connection to be added and monitored for message events.
   */
  addConnection(connection: Connection) {
    this.#connections.add(connection)

    connection.addEventListener('message', (evt) => {
      super.dispatchEvent(new MessageEvent('message', {
        data: evt.data
      }))
    })
  }

  override addEventListener<T extends keyof EventMap>(type: T, listener: ((ev: EventMap[T]) => void) | null): void {
    super.addEventListener(type, listener as EventListener)
  }

  async send(message: SignedMessage): Promise<void> {
    const promises: Promise<void>[] = []
    let atLeastOneSent = false
    for (const connection of this.#connections) {
      atLeastOneSent = true
      promises.push(connection.send(message))
    }
    if (!atLeastOneSent) {
      throw new Error('You tried to send a message without a connection. At least one connection is required.')
    }
    await Promise.all(promises)
  }
}
