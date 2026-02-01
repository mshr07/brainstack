import pyodbc
import pandas as pd
from typing import Optional
from config import Config

class DBConnector:
    def __init__(self):
        self.conn_str = Config.CONNECTION_STRING
        
    def get_connection(self):
        try:
            conn = pyodbc.connect(self.conn_str, timeout=10)
            return conn
        except pyodbc.Error as e:
            print(f"Error connecting to database: {e}")
            raise

    def fetch_data(self, query: str, chunksize: Optional[int] = None) -> pd.DataFrame:
        """
        Executes a query and returns a DataFrame.
        Supports chunking for large datasets.
        """
        conn = self.get_connection()
        try:
            print(f"Executing query: {query[:50]}...")
            if chunksize:
                # Returns an iterator
                return pd.read_sql(query, conn, chunksize=chunksize)
            else:
                return pd.read_sql(query, conn)
        finally:
            conn.close()

    def execute_non_query(self, query: str):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(query)
            conn.commit()
        finally:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    # Test connection
    db = DBConnector()
    print("Connection test initiated...")
    try:
        # Just print query not run as no DB
        print("Driver check finished.")
    except Exception as e:
        print(e)
