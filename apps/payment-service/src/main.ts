import { DatabaseService } from '@event-driven-workspace/database';
import { MessageService, PaymentEvent } from '@event-driven-workspace/message';
import express, { Request, Response } from 'express';

const startServer = async () => {
  const app = express();
  const dbService = new DatabaseService({});
  const messageService = new MessageService(dbService);

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

      await messageService.produce(PaymentEvent.ORDER_CREATED, paymentData);
      return res.send('Payment Success');
    } catch (err) {
      console.error('Request failed with', err);
      return res.json(err);
    }
  });

  app.listen(3000, () => {
    console.log('Listening on port 3000');
  });
};

startServer();
