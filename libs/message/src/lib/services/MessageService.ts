import { PubSub } from '@google-cloud/pubsub';
import { SystemEvent } from '../types';

export class MessageService {
  private pubSubClient: PubSub;

  constructor() {
    this.pubSubClient = new PubSub();
  }

  public register<T = any>(
    subscriptionName: string,
    eventHandler: (eventMessage: T) => void
  ) {
    this.pubSubClient
      .subscription(subscriptionName)
      .on('message', async (message) => {
        const data = JSON.parse(message.data.toString()) as T;
        await eventHandler(data);
        message.ack();
      })
      .on('error', (err) => console.error(err));
  }

  public produce<T = any>(eventName: SystemEvent, eventMessage: T) {
    return this.pubSubClient.topic(eventName).publishMessage({
      data: Buffer.from(JSON.stringify(eventMessage)),
    });
  }
}
