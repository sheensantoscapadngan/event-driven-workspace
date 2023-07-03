import { DatabaseService } from '@event-driven-workspace/database';

import { PubSub } from '@google-cloud/pubsub';
import { Message } from '@google-cloud/pubsub/build/src/subscriber';
import { PoolConnection } from 'mysql2';
import { v4 } from 'uuid';
import {
  EventInboxStoredProcedure,
  EventOutboxStoredProcedure,
} from '../../enums';
import { IAcknowledgeMessage, SystemEvent } from '../../types';

export class MessageService {
  private pubSubClient: PubSub;
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.pubSubClient = new PubSub();
    this.dbService = dbService;
  }

  private async markForProcessing(messageId: string) {
    // messageID should be unique to prevent double-processing
    return this.dbService.query(
      EventInboxStoredProcedure.markMessageForProcess,
      [messageId]
    );
  }

  private async markAsHandled(connection: PoolConnection, messageId: string) {
    return this.dbService.transactionalQuery(
      connection,
      EventInboxStoredProcedure.acknowledgeMessage,
      [messageId]
    );
  }

  private removeFromInbox(messageId: string) {
    return this.dbService.query(EventInboxStoredProcedure.removeMessage, [
      messageId,
    ]);
  }

  public register<T = any>(
    subscriptionName: string,
    eventHandler: (
      eventMessage: T,
      acknowledgeMessage: IAcknowledgeMessage
    ) => void
  ) {
    this.pubSubClient
      .subscription(subscriptionName)
      .on('message', async (message: Message) => {
        let event;
        try {
          event = await this.markForProcessing(message.id);
          const data = JSON.parse(message.data.toString()) as T;
          await eventHandler(data, async (connection) => {
            await this.markAsHandled(connection, message.id);
            await message.ack();
            console.info(`Message with ID ${message.id} acknowledged.`);
          });
        } catch (err) {
          console.error(err);
          if (event) {
            await this.removeFromInbox(message.id);
            console.info(`Removed message with ID ${message.id}`);
          }
          message.nack();
        }
      })
      .on('error', (err) => {
        console.error(err);
      });
  }

  public produce<T = any>(
    connection: PoolConnection,
    eventName: SystemEvent,
    eventMessage: T
  ) {
    const messageId = v4();
    return this.dbService.transactionalQuery(
      connection,
      EventOutboxStoredProcedure.publishMessage,
      [messageId, eventName, JSON.stringify(eventMessage)]
    );
  }
}
