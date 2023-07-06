import {
  CreateSubscriptionOptions,
  PubSub,
  TopicMetadata,
} from '@google-cloud/pubsub';

interface Subscription extends CreateSubscriptionOptions {
  name: string;
}

interface Topic extends TopicMetadata {
  subscriptions: Subscription[];
  name: string;
}

interface PubSubConfiguration {
  topics: Topic[];
}

const config: PubSubConfiguration = {
  topics: [
    {
      name: 'order.order_created',
      subscriptions: [
        {
          name: 'payment-order.order_created',
          retryPolicy: {
            minimumBackoff: {
              seconds: 60,
            },
            maximumBackoff: {
              seconds: 600,
            },
          },
          pushConfig: {
            pushEndpoint: 'http://localhost:4001/push',
          },
        },
      ],
    },
    {
      name: 'payment.payment_processed',
      subscriptions: [
        {
          name: 'order-payment.payment_processed',
          retryPolicy: {
            minimumBackoff: {
              seconds: 60,
            },
            maximumBackoff: {
              seconds: 600,
            },
          },
          pushConfig: {
            pushEndpoint: 'http://localhost:4000/push',
          },
        },
      ],
    },
  ],
};

const runSetup = async () => {
  console.log('Setting up Pubsub...');
  const pubSubClient = new PubSub();

  const createTopic = async (topic: Topic) => {
    try {
      await pubSubClient.createTopic(topic);
      console.log('CREATED TOPIC', topic);
    } catch (err) {
      console.error(err);
    }
  };

  const createSubscription = async (
    topic: Topic,
    subscription: Subscription
  ) => {
    try {
      await pubSubClient.createSubscription(
        topic.name,
        subscription.name,
        subscription
      );
      console.log(`CREATED SUBSCRIPTION TO ${topic.name}`, subscription);
    } catch (err) {
      console.error(err);
    }
  };

  await Promise.all(
    config.topics.map(async (topic) => {
      await createTopic(topic);
      Promise.all(
        topic.subscriptions.map((subscription) =>
          createSubscription(topic, subscription)
        )
      );
    })
  );

  console.log('Pubsub setup done...');
};

runSetup();
