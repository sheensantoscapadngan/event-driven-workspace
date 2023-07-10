import { DatabaseService } from '@event-driven-workspace/database';
import {
  MessagePublisherService,
  MessageService,
  OrderEvent,
} from '@event-driven-workspace/message';
import { PubSub } from '@google-cloud/pubsub';
import express from 'express';
import { PoolConnection } from 'mysql2';

const startServer = async () => {
  const app = express();

  app.use(express.json());

  const dbService = new DatabaseService({
    host: 'winhost',
    user: 'root-dev',
    password: 'Sh33#Santos',
    database: 'order_db',
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

  app.post('/orders', async (req, res) => {
    try {
      await dbService.transaction(async (connection: PoolConnection) => {
        const order = {
          customerName: 'Sheen',
          customerMobileNumber: '09957663043',
          customerId: 'KYC-123',
          customerBankAccount: 'PNB-12331',
          item: 'GUCCI',
          itemQuantity: 10,
          amountValue: 1000,
        };

        const result = await dbService.transactionalQuery(
          connection,
          'order_entry_insert',
          [
            order.item,
            order.itemQuantity,
            order.amountValue,
            order.customerId,
            order.customerName,
            order.customerMobileNumber,
            order.customerBankAccount,
          ]
        );

        const orderId = result[0].order_entry_id;

        await messageService.produce(connection, OrderEvent.ORDER_CREATED, {
          orderId,
          customerName: 'Sheen',
          customerMobileNumber: '09957663043',
          customerId: 'KYC-123',
          customerBankAccount: 'PNB-12331',
          item: 'GUCCI',
          itemQuantity: 10,
          amountValue: 1000,
        });

        res.send(`DONE with orderId: ${orderId}`);
      });
    } catch (err) {
      res.statusCode = 500;
      return res.json(err);
    }
  });

  app.post('/push', async (req, res) => {
    try {
      if (
        req.body.subscription ===
        'projects/meme-364412/subscriptions/order-payment.payment_processed'
      ) {
        await messageService.processPushedEvent<any>(req.body, (data, ack) => {
          return dbService.transaction(async (connection: PoolConnection) => {
            // mark order as PAID
            await dbService.transactionalQuery(
              connection,
              'order_entry_markAsPaid',
              [data.orderId]
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

  app.listen(4000, () => {
    console.log('ORDER SERVICE LISTENING ON PORT 4000');
  });
};

startServer();
