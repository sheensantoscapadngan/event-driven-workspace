import { MessageService } from '@event-driven-workspace/message';
import { startLogisticEventListeners } from './listeners/logistic';

const listenForMessageEvents = async (messageService: MessageService) => {
  startLogisticEventListeners(messageService);
};

const start = async () => {
  const messageService = new MessageService();

  await listenForMessageEvents(messageService);
  console.log('Listening for events...');
};

start();
