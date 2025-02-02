export interface BaseEvent {
  type: string

  createdAt: number
}

export interface BotCreatedEvent extends BaseEvent {
  type: 'cleaverse.bot.created'
}
export interface WorldBotMoveEvent extends BaseEvent {
  type: 'cleaverse.world.bot.move'
  pos: [x: number, y: number]
}

export type CleaverseEvent = (BotCreatedEvent | WorldBotMoveEvent) | (BaseEvent & {})
