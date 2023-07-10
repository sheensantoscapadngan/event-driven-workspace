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

  private async markForProcessing(messageUUID: string) {
    // messageUUID should be unique to prevent double-processing
    return this.dbService.query(
      EventInboxStoredProcedure.markMessageForProcess,
      [messageUUID]
    );
  }

  private async markAsHandled(connection: PoolConnection, messageUUID: string) {
    return this.dbService.transactionalQuery(
      connection,
      EventInboxStoredProcedure.acknowledgeMessage,
      [messageUUID]
    );
  }

  private removeFromInbox(messageUUID: string) {
    return this.dbService.query(EventInboxStoredProcedure.removeMessage, [
      messageUUID,
    ]);
  }

  public async processPushedEvent<T = any>(
    event,
    eventHandler: (
      eventMessage: T,
      acknowledgeMessage: IAcknowledgeMessage
    ) => void
  ) {
    let process;
    const messageUUID = event.message.attributes.messageUUID;
    if (!messageUUID) {
      throw new Error('Missing required attribute: messageUUID.');
    }
    console.info(`Received message with UUID ${messageUUID}`);

    try {
      process = await this.markForProcessing(messageUUID);
      const data = JSON.parse(
        Buffer.from(event.message.data, 'base64').toString()
      ) as T;
      await eventHandler(data, async (connection: PoolConnection) => {
        await this.markAsHandled(connection, messageUUID);
        console.info(`Message with UUID ${messageUUID} is marked as handled.`);
        console.info(`Message with UUID ${messageUUID} acknowledged.`);
      });
    } catch (err) {
      console.error(err);
      if (process) {
        await this.removeFromInbox(messageUUID);
        console.info(`Removed message with UUID ${messageUUID}`);
      }
      throw err;
    }
  }

  public registerPullSubscription<T = any>(
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
        const messageUUID = message.attributes.messageUUID;

        try {
          event = await this.markForProcessing(messageUUID);
          const data = JSON.parse(message.data.toString()) as T;
          await eventHandler(data, async (connection: PoolConnection) => {
            await this.markAsHandled(connection, messageUUID);
            await message.ack();
            console.info(`Message with UUID ${messageUUID} acknowledged.`);
          });
        } catch (err) {
          console.error(err);
          if (event) {
            await this.removeFromInbox(messageUUID);
            console.info(`Removed message with UUID ${messageUUID}`);
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
    const messageUUID = v4();
    return this.dbService.transactionalQuery(
      connection,
      EventOutboxStoredProcedure.publishMessage,
      [messageUUID, eventName, JSON.stringify(eventMessage)]
    );
  }
}
