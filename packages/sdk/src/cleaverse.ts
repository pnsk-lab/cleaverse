import { createBot, type Bot } from './bot.ts'

export class Cleaverse {
  constructor() {
  }
  createBot(): Promise<Bot> {
    return createBot(this)
  }
}
