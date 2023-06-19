import { LogisticEvent, MessageService } from '@event-driven-workspace/message';
import { ILogisticDelivery } from '@event-driven-workspace/logistic';
import { IPaymentOrder } from '@event-driven-workspace/payment';
import { MessageSubscription } from './enums/Message';

const listenForMessageEvents = async (messageService: MessageService) => {
  messageService.register<IPaymentOrder>(
    MessageSubscription.PAYMENT_ORDER_CREATED,
    (data) => {
      console.log(
        `Orchestrating delivery of ${data.productName} to ${data.fullAddress}`
      );

      messageService.produce<ILogisticDelivery>(
        LogisticEvent.DELIVERY_INITIATED,
        {
          receiverName: data.userName,
          receiverEmail: data.userEmail,
          item: data.productName,
          itemQuantity: data.productQuantity,
          receiverAddress: data.fullAddress,
        }
      );
    }
  );

  console.log('Listening for events...');
};

const start = async () => {
  const messageService = new MessageService();

  await listenForMessageEvents(messageService);
};

start();
