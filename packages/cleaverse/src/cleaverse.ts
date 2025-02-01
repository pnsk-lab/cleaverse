import { type Bot, createBot } from './bot.ts'
import { Transport } from './transport.ts'
import { SignedMessage } from './types.ts'

export class Cleaverse {
  readonly transport = new Transport()
  constructor() {
  }

  createBot(): Promise<Bot> {
    return createBot(this)
  }
}
