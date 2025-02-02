import { Cleaverse } from '@pnsk-lab/cleaverse'
import { connectNostr } from '@pnsk-lab/cleaverse-nostr'

const cleaverse = new Cleaverse()
cleaverse.transport.addConnection(await connectNostr([
  'wss://relay.snort.social/'
]))

//const bot = await cleaverse.createBot()

