import { PoolConnection } from 'mysql2';

export type IAcknowledgeMessage<> = (
  connection: PoolConnection
) => Promise<void>;
