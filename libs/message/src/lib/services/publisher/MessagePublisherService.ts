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
      messageUUID: data.message_uuid,
      eventMessage: JSON.parse(data.event_message),
    };
  }

  private markEventAsPublished(
    connection: PoolConnection,
    messageUUID: string
  ) {
    console.log(`Published event with message UUID: ${messageUUID}`);
    return this.dbService.transactionalQuery(
      connection,
      EventOutboxStoredProcedure.markAsPublished,
      [messageUUID]
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
      if (!unpublishedEvents.length) {
        return;
      }

      console.log(`Fetched ${unpublishedEvents.length} events`);

      const promises = unpublishedEvents.map(async (event) => {
        await this.pubSub.topic(event.eventName).publishMessage({
          json: event.eventMessage,
          attributes: {
            messageUUID: event.messageUUID,
          },
        });

        await this.markEventAsPublished(connection, event.messageUUID);
      });

      return Promise.all(promises);
    });
  }
}
