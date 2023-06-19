import { LogisticEvent, PaymentEvent } from '../enums/Event';

export type SystemEvent = LogisticEvent | PaymentEvent;
