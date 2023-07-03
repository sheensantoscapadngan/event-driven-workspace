import { DatabaseService } from '@event-driven-workspace/database';
import { PubSub } from '@google-cloud/pubsub';
import { MessagePublisherServer } from './MessagePublisherServer';

export class MessagePublisher {
  private server: MessagePublisherServer;

  constructor(dbService: DatabaseService, pubSub: PubSub) {
    this.server = new MessagePublisherServer(dbService, pubSub);
  }

  public start() {
    this.server.start();
  }
}
