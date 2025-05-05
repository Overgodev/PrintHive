// server/utils/db.d.ts
export interface DbExecuteResult<T = any> {
    // Define your result structure here
    [key: string]: any;
  }
  
  export interface Database {
    execute: (query: string, params?: any[]) => Promise<[DbExecuteResult[], any]>;
    // Add any other methods your database has
  }
  
  export const db: Database;