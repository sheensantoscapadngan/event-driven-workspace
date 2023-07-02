import { createPool, escape, Pool, PoolConnection, PoolOptions } from 'mysql2';

export class DatabaseService {
  private pool: Pool;

  constructor(config: PoolOptions) {
    this.pool = createPool(config);
  }

  private generateQueryString(storedProc: string, args: any[]) {
    return `CALL ${escape(storedProc)}(${args.map(escape).join()})`;
  }

  public transactionalQuery(
    connection: PoolConnection,
    storedProc: string,
    args: any[]
  ) {
    return new Promise((resolve, reject) => {
      const queryString = this.generateQueryString(storedProc, args);

      connection.query(queryString, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data[0]);
      });
    });
  }

  public query(storedProc: string, args: any[]) {
    return new Promise((resolve, reject) => {
      const queryString = this.generateQueryString(storedProc, args);

      this.pool.query(queryString, (err, data) => {
        if (err) {
          reject(err);
        }
        resolve(data[0]);
      });
    });
  }
}
