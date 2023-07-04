import { DatabaseService } from '@event-driven-workspace/database';
import { PubSub } from '@google-cloud/pubsub';
import { PoolConnection } from 'mysql2';
import { EventOutboxStoredProcedure } from '../../enums';

export class MessagePublisherService {
  private dbService: DatabaseService;
  private pubSub: PubSub;

  constructor(dbService: DatabaseService, pubSub: PubSub) {
    this.dbService = dbService;
    this.pubSub = pubSub;
  }

  private castToEventOutbox(data: any) {
    return {
      eventName: data.event_name,
      messageId: data.message_id,
      eventMessage: JSON.parse(data.event_message),
    };
  }

  private markEventAsPublished(connection: PoolConnection, messageId: string) {
    return this.dbService.transactionalQuery(
      connection,
      EventOutboxStoredProcedure.markAsPublished,
      [messageId]
    );
  }

  private async getUnpublishedEvents(connection: PoolConnection) {
    const result = await this.dbService.transactionalQuery(
      connection,
      EventOutboxStoredProcedure.getUnpublishedEventsWithLock,
      []
    );

    return result.map(this.castToEventOutbox);
  }

  public poll() {
    return this.dbService.transaction(async (connection: PoolConnection) => {
      const unpublishedEvents = await this.getUnpublishedEvents(connection);
      const promises = unpublishedEvents.map(async (event) => {
        await this.pubSub
          .topic(event.eventName)
          .publishMessage({ json: event.eventMessage });

        await this.markEventAsPublished(connection, event.messageId);
      });

      return Promise.all(promises);
    });
  }
}
