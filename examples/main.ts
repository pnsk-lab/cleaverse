import { Transport, createBot, importBot } from '@pnsk-lab/cleaverse'
import { connectNostr } from '@pnsk-lab/cleaverse-nostr'

const BOT_ID = Deno.args[0]

const transport = new Transport()
transport.addConnection(await connectNostr([
  'wss://relay.snort.social/',
  'wss://relay-jp.nostr.wirednet.jp'
]))

const bot =
  localStorage.getItem(BOT_ID)
    ? await importBot(JSON.parse(localStorage.getItem(BOT_ID)!), transport)
    : await createBot(transport)

localStorage.setItem(BOT_ID, JSON.stringify(await bot.serialize()))

await bot.startService()
console.log('Started service')
