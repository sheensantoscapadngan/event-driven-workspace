import { MessageService } from '@event-driven-workspace/message';
import { startPaymentEventListeners } from './listeners/Logistic';

const listenForMessageEvents = async (
  messageService: MessageService,
  databaseService
) => {
  startPaymentEventListeners(messageService, databaseService);
  console.log('Listening for events...');
};

const start = async () => {
  const messageService = new MessageService();
  const databaseService = {};

  await listenForMessageEvents(messageService, databaseService);
};

start();
