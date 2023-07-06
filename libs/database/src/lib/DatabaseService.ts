import { createPool, escape, Pool, PoolConnection, PoolOptions } from 'mysql2';

export class DatabaseService {
  private pool: Pool;

  constructor(config: PoolOptions) {
    this.pool = createPool(config);
  }

  private getConnection(): Promise<PoolConnection> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err, connection) => {
        if (err) {
          reject(err);
        }
        resolve(connection);
      });
    });
  }

  private generateQueryString(storedProc: string, args: any[]) {
    return `CALL ${storedProc}(${args.map(escape).join()})`;
  }

  public async transactionalQuery(
    connection: PoolConnection,
    storedProc: string,
    args: any[]
  ): Promise<any[]> {
    const queryString = this.generateQueryString(storedProc, args);
    const result = await connection.promise().query(queryString);
    return result[0][0] as any[];
  }

  public async transaction<T = any>(
    process: (connection: PoolConnection) => Promise<T>
  ) {
    const connection = await this.getConnection();
    try {
      await connection.promise().beginTransaction();
      const result = await process(connection);
      await connection.promise().commit();

      return result;
    } catch (err) {
      console.error(err);
      await connection.promise().rollback();
      console.error('rolled back changes...');
      throw err;
    } finally {
      connection.release();
    }
  }

  public query(storedProc: string, args: any[]) {
    const queryString = this.generateQueryString(storedProc, args);
    const result = this.pool.promise().query(queryString);
    return result[0][0];
  }
}
