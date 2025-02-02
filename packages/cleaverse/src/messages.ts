export interface BaseMessage {
  type: string
}

export interface BotCreatedMessage extends BaseMessage {
  type: 'cleaverse.bot.created'
}
export interface WorldBotMoveMessage extends BaseMessage {
  type: 'cleaverse.world.bot.move'
  pos: [x: number, y: number]
}

export type CleaverseMessage = BotCreatedMessage | WorldBotMoveMessage
