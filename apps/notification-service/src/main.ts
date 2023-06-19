import { ILogisticDelivery } from '@event-driven-workspace/logistic';
import { MessageSubscription } from './enums/Message';
import { MessageService } from '@event-driven-workspace/message';

const listenForMessageEvents = async (messageService: MessageService) => {
  messageService.register<ILogisticDelivery>(
    MessageSubscription.LOGISTIC_DELIVERY_INITIATED,
    (data) => {
      const notificationMessage = `A delivery of ${data.itemQuantity} ${data.item} is on your way!`;
      console.log(
        `Sending delivery email to ${data.receiverEmail} with message \n${notificationMessage}`
      );
    }
  );
};

const start = async () => {
  const messageService = new MessageService();

  await listenForMessageEvents(messageService);
  console.log('Listening for events...');
};

start();
