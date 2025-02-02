import type { Cleaverse } from './cleaverse.ts'
import uint8Array_base64 from '@ns/ikox/uint8array-base64'
import type { SignedMessage } from './types.ts'
import type { BaseMessage, CleaverseMessage } from './messages.ts'

const encoder = new TextEncoder()

export class Bot {
  #keyPair: CryptoKeyPair
  #cleaverse: Cleaverse
  constructor(keyPair: CryptoKeyPair, cleaverse: Cleaverse) {
    this.#keyPair = keyPair
    this.#cleaverse = cleaverse
    cleaverse.transport.addEventListener('message', this.#subscribeFn)
  }

  #subscribeFn = (evt: MessageEvent<SignedMessage>) => {
    console.log(evt.data)
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
  const bot = new Bot(keyPair, cleaverse)

  await bot.sendMessage({
    type: 'cleaverse.world.bot.created',
  })

  return bot
}
