import { Cleaverse } from '@pnsk-lab/cleaverse'
import { connectWSClient } from '@pnsk-lab/cleaverse/ws-client'

const cleaverse = new Cleaverse()
cleaverse.transport.addConnection(await connectWSClient('ws://localhost:8080'))

const bot = await cleaverse.createBot()
