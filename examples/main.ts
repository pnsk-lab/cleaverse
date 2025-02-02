import { Cleaverse } from '@pnsk-lab/cleaverse'
import { connectNostr } from '@pnsk-lab/cleaverse-nostr'

const BOT_ID = Deno.args[0]

const cleaverse = new Cleaverse()
cleaverse.transport.addConnection(await connectNostr([
  'wss://relay.snort.social/',
  'wss://relay-jp.nostr.wirednet.jp'
]))

const bot =
  localStorage.getItem(BOT_ID)
    ? await cleaverse.importBot(JSON.parse(localStorage.getItem(BOT_ID)!))
    : await cleaverse.createBot()

localStorage.setItem(BOT_ID, JSON.stringify(await bot.serialize()))

bot.moveFor(1, 0)
