import { DatabaseService } from '@event-driven-workspace/database';
import { PubSub } from '@google-cloud/pubsub';

export class MessagePublisherService {
  private dbService: DatabaseService;
  private pubSub: PubSub;

  constructor(dbService: DatabaseService, pubSub: PubSub) {
    this.dbService = dbService;
    this.pubSub = pubSub;
  }

  private getUnpublishedEvents() {
    //
  }

  public poll() {
    // get unpublished events
    // publish to pubsub
    // mark events as published
  }
}
