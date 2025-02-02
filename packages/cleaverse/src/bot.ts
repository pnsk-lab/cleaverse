import uint8Array_base64 from '@ns/ikox/uint8array-base64'
import base64_uint8array from '@ns/ikox/base64-uint8array'
import uintArray_hex from '@ns/ikox/uint8array-hex'
import type { Pos, SignedMessage } from './types.ts'
import type { BaseEvent, CleaverseEvent } from './events.ts'
import type { Transport } from './transport.ts'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

interface BotInit {
  transport: Transport
  keyPair: CryptoKeyPair
  pos: Pos
}

export interface SerializedBot {
  publicKey: string
  privateKey: string
}

export class Bot {
  #keyPair: CryptoKeyPair
  #transport: Transport
  #pos: [x: number, y: number]
  #lastPosSent: number = 0
  constructor({ keyPair, transport, pos }: BotInit) {
    this.#keyPair = keyPair
    this.#transport = transport
    this.#pos = pos
  }

  async #sendMove() {
    this.#lastPosSent = Date.now()
    await this.sendEvent({
      type: 'cleaverse.world.bot.move',
      pos: this.#pos,
      createdAt: Date.now(),
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
  async signEvent(event: (BaseEvent & {}) | CleaverseEvent): Promise<SignedMessage> {
    const json = JSON.stringify(event)

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
      event: json,
      signature,
      from: await this.getBotId(),
      id: uintArray_hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(json)))),
    }
  }
  async sendEvent(message: (BaseEvent & {}) | CleaverseEvent) {
    return await this.#transport.send(await this.signEvent(message))
  }

  async serialize(): Promise<SerializedBot> {
    const publicKey = uint8Array_base64(await this.getPublicKey())
    const privateKey = uint8Array_base64(new Uint8Array(await crypto.subtle.exportKey('pkcs8', this.#keyPair.privateKey)))

    return {
      publicKey,
      privateKey,
    }
  }

  async startService() {
    const started = Date.now()
    this.#transport.addEventListener('message', ({ data: msg }) => {
      if (msg.uncompressed.createdAt < started) {
        return
      }
    })
  }
}

export const importBot = async (serialized: SerializedBot, transport: Transport) => {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    base64_uint8array(serialized.privateKey),
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign'],
  )
  const publicKey = await crypto.subtle.importKey(
    'raw',
    base64_uint8array(serialized.publicKey),
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['verify'],
  )
  const bot = new Bot({
    keyPair: {
      publicKey,
      privateKey
    },
    transport,
    pos: [0, 0]
  })
  return bot
}

export const createBot = async (transport: Transport) => {
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
    transport,
    pos: [0, 0]
  })

  await bot.sendEvent({
    type: 'cleaverse.world.bot.created',
    createdAt: Date.now(),
  })

  return bot
}
