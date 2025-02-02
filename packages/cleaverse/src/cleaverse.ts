import { type Bot, createBot, importBot, SerializedBot } from './bot.ts'
import { Transport } from './transport.ts'
import { SignedMessage } from './types.ts'

export class Cleaverse {
  readonly transport = new Transport()
  #primaryBot?: Bot
  constructor() {
    
  }

  async createBot(): Promise<Bot> {
    const bot = await createBot(this)
    this.#primaryBot ??= bot
    return bot
  }

  /**
   * Creates a bot from its serialized form.
   * @param serialized The serialized bot.
   * @returns The deserialized bot.
   */
  async importBot(serialized: SerializedBot): Promise<Bot> {
    const bot = await importBot(serialized, this)
    this.#primaryBot ??= bot
    return bot
  }
}
