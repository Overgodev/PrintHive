export interface Database {
    query<T>(
      sql: string, 
      values?: any | any[] | { [param: string]: any }
    ): Promise<[T, any]>;
    
    execute<T>(
      sql: string, 
      values?: any | any[] | { [param: string]: any }
    ): Promise<[T, any]>;
  }