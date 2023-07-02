export enum EventOutboxStoredProcedure {
  publishMessage = 'event_outbox_insert',
}

export enum EventInboxStoredProcedure {
  markMessageForProcess = 'event_inbox_markForProcessing',
  acknowledgeMessage = 'event_inbox_acknowledge',
  getByMessageId = 'event_inbox_getByMessageId',
  removeMessage = 'event_inbox_removeByMessageId',
}
