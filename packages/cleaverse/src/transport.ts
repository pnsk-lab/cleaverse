/**
 * Transport Layer
 * @module
 */

import type { SignedMessage } from './types.ts'

interface MessageEventListener extends EventListener {
  (ev: MessageEvent<SignedMessage>): void
}

export type ConnectionReadyState = 'OPEN' | 'CLOSED'
/**
 * Connection
 */
export abstract class Connection extends EventTarget {
  abstract send(message: SignedMessage): Promise<void>
  abstract close(): Promise<void>

  abstract readyState: ConnectionReadyState

  override addEventListener(type: 'message', listener: MessageEventListener | null): void
  override addEventListener(type: 'close', listener: EventListener | null): void
  override addEventListener(type: string, listener: EventListener | null): void {
    super.addEventListener(type, listener)
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
      this.dispatchEvent(evt)
    })
  }

  override addEventListener(type: 'message', listener: MessageEventListener | null): void
  override addEventListener(type: string, listener: EventListener | null): void {
    super.addEventListener(type, listener)
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
