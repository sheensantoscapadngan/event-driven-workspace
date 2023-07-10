import { DatabaseService } from '@event-driven-workspace/database';
import {
  MessagePublisherService,
  MessageService,
  PaymentEvent,
} from '@event-driven-workspace/message';
import { PubSub } from '@google-cloud/pubsub';
import express, { Request, Response } from 'express';
import { PoolConnection } from 'mysql2';

const startServer = async () => {
  const app = express();

  const dbService = new DatabaseService({
    host: 'winhost',
    user: 'root-dev',
    password: 'Sh33#Santos',
    database: 'payment_db',
    dateStrings: true,
    connectionLimit: 100,
  });

  const messageService = new MessageService(dbService);

  // Ideally kay this should be in another service/deployment...
  const messagePublisherService = new MessagePublisherService(
    dbService,
    new PubSub()
  );

  setInterval(() => {
    messagePublisherService.poll();
  }, 1000);
  console.log('CONFIGURED MESSAGE PUBLISHER SERVICE...');

  app.use(express.json());

  app.post('/payment', async (req: Request, res: Response) => {
    try {
      const paymentData = {
        productName: 'Example Product',
        productQuantity: 10,
        amountValue: 25.99,
        userEmail: 'example@example.com',
        userName: 'SHEEN',
        fullAddress: 'Cebu, Philippines',
      };

      dbService.transaction(async (connection: PoolConnection) => {
        await messageService.produce(
          connection,
          PaymentEvent.PAYMENT_PROCESSED,
          paymentData
        );
      });

      return res.send('Payment Success');
    } catch (err) {
      console.error('Request failed with', err);
      return res.json(err);
    }
  });

  app.post('/push', async (req: Request, res: Response) => {
    try {
      if (
        req.body.subscription ===
        'projects/meme-364412/subscriptions/payment-order.order_created'
      ) {
        await messageService.processPushedEvent<any>(req.body, (data, ack) => {
          return dbService.transaction(async (connection: PoolConnection) => {
            // CALL API HERE OR SOMETHING IDK
            await messageService.produce(
              connection,
              PaymentEvent.PAYMENT_PROCESSED,
              {
                orderId: data.orderId,
                status: 'SUCCESS',
              }
            );
            await ack(connection);
          });
        });
      }

      res.statusCode = 200;
      return res.send('Payment Success');
    } catch (err) {
      console.error('Request failed with', err);
      res.statusCode = 500;
      return res.json(err);
    }
  });

  app.listen(4001, () => {
    console.log('Listening on port 4001');
  });
};

startServer();
