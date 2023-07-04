import { createPool, escape, Pool, PoolConnection, PoolOptions } from 'mysql2';
import { promisify } from 'util';

export class DatabaseService {
  private pool: Pool;
  private promisifiedGetConnection: () => Promise<PoolConnection>;

  constructor(config: PoolOptions) {
    this.pool = createPool(config);
    this.promisifiedGetConnection = promisify(this.pool.getConnection);
  }

  private generateQueryString(storedProc: string, args: any[]) {
    return `CALL ${escape(storedProc)}(${args.map(escape).join()})`;
  }

  public transactionalQuery(
    connection: PoolConnection,
    storedProc: string,
    args: any[]
  ): Promise<any[]> {
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

  public async transaction<T = any>(
    process: (connection: PoolConnection) => Promise<T>
  ) {
    const connection = await this.promisifiedGetConnection();
    try {
      const result = await process(connection);
      connection.commit();
      return result;
    } catch (err) {
      console.error(err);
      connection.rollback(() => {
        console.error('rolled back changes...');
      });
    } finally {
      connection.release();
    }
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
