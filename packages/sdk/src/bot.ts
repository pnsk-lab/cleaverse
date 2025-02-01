import type { Cleaverse } from './cleaverse.ts'

export class Bot {
  constructor(keyPair: CryptoKeyPair, cleaverse: Cleaverse) {
    
  }
}

export const createBot = async (cleaverse: Cleaverse) => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-PSS',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  )
  return new Bot(keyPair, cleaverse)
}
