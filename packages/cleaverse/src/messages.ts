export interface BaseMessage {
  type: string
}

export interface BotCreatedMessage extends BaseMessage {
  type: 'cleaverse.world.bot.created'
}

export type CleaverseMessage = BotCreatedMessage
