import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler

class FeatureEngineer:
    def __init__(self):
        self.scalers = {}
        self.encoders = {}
        
    def process_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Part 5: Data Processing & Feature Engineering
        """
        df = df.copy()
        
        # 1. Handle Missing Values
        # numeric
        num_cols = df.select_dtypes(include=[np.number]).columns
        for col in num_cols:
            df[col] = df[col].fillna(df[col].median())
            
        # categorical
        cat_cols = df.select_dtypes(include=['object']).columns
        for col in cat_cols:
            df[col] = df[col].fillna('Unknown')

        # 2. Handle Skewed Distributions (Log transform amounts)
        if 'total_billed_amount' in df.columns:
            df['log_billed_amount'] = np.log1p(df['total_billed_amount'])

        # 3. Encode Categorical Variables
        # For high cardinality (provider_id, member_id), we might use frequency encoding or just IDs if numeric
        # Here we encode 'specialty', 'state', etc.
        cols_to_encode = ['specialty', 'provider_type', 'claim_status']
        for col in cols_to_encode:
            if col in df.columns:
                le = LabelEncoder()
                df[col + '_encoded'] = le.fit_transform(df[col].astype(str))
                self.encoders[col] = le

        # 4. Create Analytical Features
        
        # Claims per provider (already aggregated in SQL? usage here implies pandas logic)
        # Assuming df is at Claim Level for modeling
        
        # Time-gap features
        if 'claim_date' in df.columns and 'admission_date' in df.columns:
            # ensure datetime
            df['claim_date'] = pd.to_datetime(df['claim_date'], errors='coerce')
            df['admission_date'] = pd.to_datetime(df['admission_date'], errors='coerce')
            df['days_since_admission'] = (df['claim_date'] - df['admission_date']).dt.days.fillna(0)

        return df

    def create_target(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Part 6: Target Definition
        Define a realistic target variable: Anomaly/Fraud Risk
        """
        # Logic: High billed amount relative to specialty stats OR specific diagnosis patterns
        # Since we generated dummy data with some logic:
        # - High z-score in SQL
        # - Denied claims
        
        # Let's create a binary target 'is_anomaly'
        # 1 if Claim Status is DENIED OR Billed Amount > 99th percentile
        
        threshold = df['total_billed_amount'].quantile(0.99)
        
        conditions = [
            (df['claim_status'] == 'DENIED') | (df['total_billed_amount'] > threshold)
        ]
        
        df['is_anomaly'] = np.select(conditions, [1], default=0)
        
        # Ensure class imbalance
        print(f"Class Distribution:\n{df['is_anomaly'].value_counts(normalize=True)}")
        
        return df
