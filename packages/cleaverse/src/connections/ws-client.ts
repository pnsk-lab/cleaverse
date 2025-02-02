import { Connection, type ConnectionReadyState } from '../transport.ts'
import type { SignedMessage } from '../types.ts'

class WSClient extends Connection {
  #ws: WebSocket
  readyState: ConnectionReadyState = 'OPEN'

  constructor(ws: WebSocket) {
    super()
    this.#ws = ws
    ws.addEventListener('close', () => {
      this.readyState = 'CLOSED'
      this.dispatchEvent(new Event('close'))
    })
    ws.addEventListener('message', (event) => {
      const data = event.data
      this.receiveJSON(data)
    })
  }

  send(message: SignedMessage): Promise<void> {
    this.#ws.send(JSON.stringify(message))
    return Promise.resolve()
  }

  close(): Promise<void> {
    this.readyState = 'CLOSED'
    this.#ws.close()
    return Promise.resolve()
  }
}
export const connectWSClient = async (source: string | URL | WebSocket) => {
  const ws = source instanceof WebSocket ? source : new WebSocket(source)
  await new Promise<void>((resolve, reject) => {
    ws.addEventListener('open', () => {
      resolve()
    })
    ws.addEventListener('error', (e) => {
      reject(e instanceof ErrorEvent ? e.error : e)
    })
  })

  return new WSClient(ws)
}

export type { WSClient }
