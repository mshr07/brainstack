import sys
import os
import pandas as pd
import numpy as np

# Add src to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import Config
from db_connector import DBConnector
from features import FeatureEngineer
from modeling import ModelTrainer

def main():
    print("Starting End-to-End Analytics Pipeline...")
    
    # Setup directories
    if not os.path.exists(Config.OUTPUT_DIR):
        os.makedirs(Config.OUTPUT_DIR)
        
    if not os.path.exists(os.path.dirname(Config.MODEL_PATH)):
        os.makedirs(os.path.dirname(Config.MODEL_PATH))

    # Part 4: Pull Data
    # In a real scenario, we connect to DB.
    # For this portable project, we check if DB is reachable, else load from CSV generated in Part 1
    db = DBConnector()
    try:
        print("Attempting DB connection...")
        query = """
            SELECT c.*, p.specialty, p.provider_type, p.state as provider_state 
            FROM dbo.claims c 
            LEFT JOIN dbo.providers p ON c.provider_id = p.provider_id
        """
        df = db.fetch_data(query) 
        print("Successfully pulled data from SQL Server.")
    except Exception as e:
        print(f"DB connection failed: {e}. Loading from generated CSVs...")
        claims_path = f"{Config.DATA_DIR}/claims.csv"
        providers_path = f"{Config.DATA_DIR}/providers.csv"
        
        if not os.path.exists(claims_path):
            print("Data not found. Please run data_gen/generate_data.py first.")
            return

        # Load subset for memory efficiency if needed, but 1M rows is fine for 16GB RAM
        claims = pd.read_csv(claims_path) 
        providers = pd.read_csv(providers_path)
        
        # Merge for analytics
        df = claims.merge(providers, on='provider_id', how='left')

    # Part 5 & 6: Data Processing & Feature Engineering & Target
    fe = FeatureEngineer()
    df_processed = fe.process_data(df)
    df_processed = fe.create_target(df_processed)
    
    # Prepare X and y
    # Drop non-numeric or leak columns
    drop_cols = ['claim_id', 'member_id', 'provider_id', 'claim_date', 'admission_date', 
                 'discharge_date', 'diagnosis_code_1', 'diagnosis_code_2', 'diagnosis_code_3', 
                 'provider_name', 'city', 'npi', 'first_name', 'last_name', 'dob', 'check_number',
                 'is_anomaly'] # Drop target from X
                 
    # We need to handle categorical columns that weren't encoded or drop them
    # process_data encoded some.
    
    # Drop known unwanted columns first, then strict numeric selection
    X = df_processed.drop(columns=[c for c in drop_cols if c in df_processed.columns], errors='ignore')
    X = X.select_dtypes(include=[np.number])
    
    y = df_processed['is_anomaly']
    
    print(f"Features for modeling: {X.columns.tolist()}")

    # Part 7 & 8: Modeling
    trainer = ModelTrainer()
    trainer.train_and_evaluate(X, y)
    trainer.save_best_model()
    
    # Part 9: Final Output
    trainer.generate_final_output(df_processed, X)
    
    print("Pipeline Completed Successfully.")

if __name__ == "__main__":
    main()
