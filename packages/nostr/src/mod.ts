import * as nostr from 'nostr-tools'
import { Connection, type SignedMessage, type ConnectionReadyState, parseTextIntoSignedMessage } from '@pnsk-lab/cleaverse'

class NostrConnection extends Connection {
  #sk: Uint8Array
  #websockets: WebSocket[]

  readyState: ConnectionReadyState = 'OPEN'
  constructor(websockets: WebSocket[]) {
    super()

    this.#sk = nostr.generateSecretKey()
    this.#websockets = websockets

    for (const ws of this.#websockets) {
      ws.onmessage = (evt) => {
        const parsed: ['OK'] | ['EVENT', string, nostr.NostrEvent] = JSON.parse(evt.data)

        switch (parsed[0]) {
          case 'EVENT': {
            const [_eventName, _subId, event] = parsed
            const data = parseTextIntoSignedMessage(event.content)
            if (!data) {
              return
            }
            this.dispatchEvent(new MessageEvent<SignedMessage>('message', {
              data
            }))
            break
          }
        }
      }
    }
    this.#send(['REQ', crypto.randomUUID(), {
      kinds: [21753],
      '#t': ['CLEAVERSE_RELAY']
    }])
  }

  #send(e: ['EVENT', nostr.VerifiedEvent] | ['REQ', string, ...nostr.Filter[]]) {
    for (const ws of this.#websockets) {
      ws.send(JSON.stringify(e))
    }
  }

  send(message: SignedMessage) {
    const event = nostr.finalizeEvent({
      kind: 21753,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['t', 'CLEAVERSE_RELAY'], ['f', `CLEAVERSE_FROM_${message.from}`]],
      content: JSON.stringify(message)
    }, this.#sk)
    this.#send(['EVENT', event])

    return Promise.resolve()
  }

  close(): Promise<void> {
    for (const ws of this.#websockets) {
      ws.close()
    }
    this.readyState = 'CLOSED'
    return Promise.resolve()
  }
}

export const connectNostr = async (relays: (string | URL)[]) => {
  const websockets = (await Promise.all(relays.map(relay => new Promise<WebSocket | null>((resolve) => {
    const ws = new WebSocket(relay)
    ws.onopen = () => {
      resolve(ws)
    }
    ws.onerror = () => {
      resolve(null)
    }
  })))).filter(ws => ws !== null)
  if (websockets.length === 0) {
    throw new Error('No relays available.')
  }
  return new NostrConnection(websockets)
}
