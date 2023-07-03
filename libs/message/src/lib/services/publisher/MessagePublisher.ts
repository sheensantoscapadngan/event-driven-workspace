import { DatabaseService } from '@event-driven-workspace/database';
import { PubSub } from '@google-cloud/pubsub';
import { MessagePublisherServer } from './MessagePublisherServer';
import { MessagePublisherService } from './MessagePublisherService';

export class MessagePublisher {
  private server: MessagePublisherServer;

  constructor(dbService: DatabaseService, pubSub: PubSub) {
    const messagePublisherService = new MessagePublisherService(
      dbService,
      pubSub
    );

    this.server = new MessagePublisherServer(messagePublisherService);
  }

  public start() {
    this.server.start();
  }
}
