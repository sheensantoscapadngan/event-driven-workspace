import { DatabaseService } from '@event-driven-workspace/database';

import { PubSub } from '@google-cloud/pubsub';
import { Message } from '@google-cloud/pubsub/build/src/subscriber';
import { PoolConnection } from 'mysql2';
import { v4 } from 'uuid';
import { EventStoredProcedure } from '../enums';
import { IAcknowledgeMessage, SystemEvent } from '../types';

export class MessageService {
  private pubSubClient: PubSub;
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.pubSubClient = new PubSub();
    this.dbService = dbService;
  }

  private async verifyUnhandledState(messageId: string) {
    const result = await this.dbService.query(
      EventStoredProcedure.getByMessageId,
      [messageId]
    );

    if (result) {
      throw new Error('Message has already been handled.');
    }
  }

  private async markMessageAsHandled(
    connection: PoolConnection,
    messageId: string
  ) {
    return this.dbService.transactionalQuery(
      connection,
      EventStoredProcedure.acknowledgeMessage,
      [messageId]
    );
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
        // verify if message is unhandled to prevent double processing
        await this.verifyUnhandledState(message.id);
        const data = JSON.parse(message.data.toString()) as T;
        await eventHandler(data, async (connection) => {
          await this.markMessageAsHandled(connection, message.id);
          await message.ackWithResponse();
          console.info(`Message with ID ${message.id} acknowledged.`);
        });
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
      EventStoredProcedure.publishMessage,
      [messageId, eventName, JSON.stringify(eventMessage)]
    );
  }
}
