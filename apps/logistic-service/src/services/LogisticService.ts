import { ILogisticDelivery } from '@event-driven-workspace/logistic';
import { LogisticEvent, MessageService } from '@event-driven-workspace/message';

export class LogisticService {
  private messageService: MessageService;
  private databaseService;

  constructor(messageService: MessageService, databaseService) {
    this.messageService = messageService;
    this.databaseService = databaseService;
  }

  public process(delivery: ILogisticDelivery) {
    console.log(
      `Orchestrating delivery of ${delivery.item} to ${delivery.receiverAddress}`
    );

    this.messageService.produce<ILogisticDelivery>(
      LogisticEvent.DELIVERY_INITIATED,
      delivery
    );
  }
}
