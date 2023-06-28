import { MessageService } from '@event-driven-workspace/message';
import { IPaymentOrder } from '@event-driven-workspace/payment';
import { MessageSubscription } from '../enums/Message';
import { LogisticService } from '../services/LogisticService';

export const startPaymentEventListeners = (
  messageService: MessageService,
  databaseService
) => {
  const logisticService = new LogisticService(messageService, databaseService);

  messageService.register<IPaymentOrder>(
    MessageSubscription.PAYMENT_ORDER_CREATED,
    (data) => {
      return logisticService.process({
        item: data.productName,
        itemQuantity: data.productQuantity,
        receiverAddress: data.fullAddress,
        receiverEmail: data.userEmail,
        receiverName: data.userName,
      });
    }
  );
};
