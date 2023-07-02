export enum EventStoredProcedure {
  acknowledgeMessage = 'event_inbox_acknowledge',
  publishMessage = 'event_outbox_insert',
  getByMessageId = 'event_inbox_getByMessageId',
}
