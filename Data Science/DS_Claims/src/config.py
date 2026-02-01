import os

class Config:
    # SQL Server Settings
    SERVER = os.getenv('SQL_SERVER', 'localhost,14330')
    DATABASE = 'cotiviti_like_analytics'
    USERNAME = os.getenv('SQL_USER', 'sa')
    PASSWORD = os.getenv('SQL_PASSWORD', 'SqlServer@123')
    DRIVER = '{ODBC Driver 18 for SQL Server}'
    
    CONNECTION_STRING = f'DRIVER={DRIVER};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD};TrustServerCertificate=yes;'
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATA_DIR = os.path.join(BASE_DIR, 'data')
    OUTPUT_DIR = os.path.join(BASE_DIR, 'output')
    MODEL_PATH = os.path.join(BASE_DIR, 'models', 'best_model.pkl')

    # Model Settings
    TEST_SIZE = 0.2
    RANDOM_STATE = 42
