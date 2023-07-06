import { LogisticEvent, OrderEvent, PaymentEvent } from '../enums/Event';

export type SystemEvent = LogisticEvent | PaymentEvent | OrderEvent;
