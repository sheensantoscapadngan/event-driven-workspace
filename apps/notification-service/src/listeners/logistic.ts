import { ILogisticDelivery } from '@event-driven-workspace/logistic';
import { MessageService } from '@event-driven-workspace/message';
import { MessageSubscription } from '../enums/Message';
import { EmailService } from '../services/EmailService';

export const startLogisticEventListeners = (messageService: MessageService) => {
  const emailService = new EmailService();

  messageService.register<ILogisticDelivery>(
    MessageSubscription.LOGISTIC_DELIVERY_INITIATED,
    (data) => {
      const message = `A delivery of ${data.itemQuantity} ${data.item} is on your way!`;
      return emailService.send(data.receiverEmail, message);
    }
  );
};
