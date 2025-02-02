import type { Cleaverse } from './cleaverse.ts'
import uint8Array_base64 from '@ns/ikox/uint8array-base64'
import type { Pos, SignedMessage } from './types.ts'
import type { BaseMessage, CleaverseMessage } from './messages.ts'

const encoder = new TextEncoder()

interface BotInit {
  cleaverse: Cleaverse
  keyPair: CryptoKeyPair
  pos: Pos
}

export class Bot {
  #keyPair: CryptoKeyPair
  #cleaverse: Cleaverse
  #pos: [x: number, y: number]
  #lastPosSent: number = 0
  constructor({ keyPair, cleaverse, pos }: BotInit) {
    this.#keyPair = keyPair
    this.#cleaverse = cleaverse
    this.#pos = pos
    cleaverse.transport.addEventListener('message', this.#subscribeFn)
  }

  #subscribeFn = (evt: MessageEvent<SignedMessage>) => {
    console.log(evt.data)
  }

  async #sendMove() {
    this.#lastPosSent = Date.now()
    await this.sendMessage({
      type: 'cleaverse.world.bot.move',
      pos: this.#pos
    })
  }
  async moveFor(dx: number, dy: number): Promise<Pos> {
    if (this.#lastPosSent === 0) {
      await this.#sendMove()
    }
    const dt = (Date.now() / this.#lastPosSent) / 1000
    const allowedSpeed = 8 / (dt + 1)
    const speed = Math.hypot(dx, dy)
    if (speed < allowedSpeed) {
      this.#pos[0] += dx
      this.#pos[1] += dy
    } else {
      const ratio = allowedSpeed / speed
      this.#pos[0] += dx * ratio
      this.#pos[1] += dy * ratio
    }
    await this.#sendMove()
    return this.#pos
  }

  #cachedPublicKey?: Uint8Array
  async getPublicKey(): Promise<Uint8Array> {
    if (this.#cachedPublicKey) {
      return this.#cachedPublicKey
    }
    const publicKey = new Uint8Array(
      await crypto.subtle.exportKey('raw', this.#keyPair.publicKey),
    )
    this.#cachedPublicKey = publicKey
    return publicKey
  }
  async getBotId() {
    return uint8Array_base64(await this.getPublicKey())
  }
  async signMessage(message: unknown): Promise<SignedMessage> {
    const json = JSON.stringify(message)

    const signature = uint8Array_base64(
      new Uint8Array(
        await crypto.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          this.#keyPair.privateKey,
          encoder.encode(json),
        ),
      ),
    )

    return {
      json,
      signature,
      from: await this.getBotId(),
    }
  }
  async sendMessage(message: (BaseMessage & {}) | CleaverseMessage) {
    return await this.#cleaverse.transport.send(await this.signMessage(message))
  }
}

export const createBot = async (cleaverse: Cleaverse) => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: "P-256"
    },
    true,
    ['sign', 'verify'],
  )
  const bot = new Bot({
    keyPair,
    cleaverse,
    pos: [0, 0]
  })

  await bot.sendMessage({
    type: 'cleaverse.world.bot.created',
  })

  return bot
}
