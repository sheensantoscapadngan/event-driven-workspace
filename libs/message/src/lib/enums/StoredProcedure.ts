export enum EventOutboxStoredProcedure {
  publishMessage = 'event_outbox_insert',
  getUnpublishedEventsWithLock = 'event_outbox_getUnpublishedWithLock',
  markAsPublished = 'event_outbox_markAsPublished',
}

export enum EventInboxStoredProcedure {
  markMessageForProcess = 'event_inbox_markForProcessing',
  acknowledgeMessage = 'event_inbox_acknowledge',
  removeMessage = 'event_inbox_removeByMessageUUID',
}
