import { ILogisticDelivery } from '@event-driven-workspace/logistic';
import {
  IAcknowledgeMessage,
  LogisticEvent,
  MessageService,
} from '@event-driven-workspace/message';

export class LogisticService {
  private messageService: MessageService;
  private databaseService;

  constructor(messageService: MessageService, databaseService) {
    this.messageService = messageService;
    this.databaseService = databaseService;
  }

  public async process(
    delivery: ILogisticDelivery,
    acknowledgeMessage: IAcknowledgeMessage
  ) {
    console.log(
      `Orchestrating delivery of ${delivery.item} to ${delivery.receiverAddress}`
    );
    const connection = 'asdasd' as any;
    await acknowledgeMessage(connection);
    this.messageService.produce<ILogisticDelivery>(
      connection,
      LogisticEvent.DELIVERY_INITIATED,
      delivery
    );
  }
}
