import pandas as pd
import numpy as np
import pyodbc
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, confusion_matrix



def get_db_connection():

    conn_str = (
        "DRIVER={ODBC Driver 18 for SQL Server};"
        "SERVER=localhost,1433;"
        "DATABASE=claims_db;"
        "UID=SA;"
        "PWD=StrongPass123!;"
        "TrustServerCertificate=yes;"
    )
    return pyodbc.connect(conn_str)

def load_data():
    conn = get_db_connection()
    query = """
    SELECT 
        c.ClaimID, c.ProviderID, c.PatientID, c.ClaimDate, 
        c.ClaimAmount, c.DiagnosisCode, c.Status,
        p.Specialty, p.Region
    FROM dbo.Claims c
    JOIN dbo.Providers p ON c.ProviderID = p.ProviderID
    """
    df = pd.read_sql(query, conn)
    conn.close()
    return df

# Load data into pandas DataFrame
print("Loading data from SQL Server...")
try:
    df = load_data()
    print(f"Data loaded successfully. Shape: {df.shape}")
except Exception as e:
    print("Error connecting to database. Ensure SQL Server is running and requirements are installed.")
    print(e)
    # create dummy data if connection fails for demonstration
    print("Creating dummy data for demonstration...")
    df = pd.DataFrame({
        'ClaimID': range(1, 151),
        'ProviderID': np.random.randint(1, 6, 150),
        'ClaimAmount': np.random.uniform(50, 5000, 150),
        'Status': np.random.choice(['Paid', 'Denied'], 150, p=[0.9, 0.1]),
        'DiagnosisCode': np.random.choice(['J01.90', 'I10', 'E11.9'], 150),
        'Specialty': np.random.choice(['General', 'Cardiology'], 150),
        'Region': np.random.choice(['North', 'South'], 150)
    })



# 1. Handle missing values
df['ClaimAmount'] = df['ClaimAmount'].fillna(df['ClaimAmount'].mean())

# 2. Remove invalid records (e.g. negative amounts)
df = df[df['ClaimAmount'] >= 0]

# 3. Create new analytical features
df['IsHighValue'] = (df['ClaimAmount'] > 2000).astype(int)
df['LogClaimAmount'] = np.log1p(df['ClaimAmount'])

print("\nData processed.")
print(df.head())

# 1. Exploratory Data Analysis
print("\nSummary Statistics:")
print(df.describe())

# 2. Detect outliers (Z-score method)
df['Z_Score'] = (df['ClaimAmount'] - df['ClaimAmount'].mean()) / df['ClaimAmount'].std()
outliers = df[np.abs(df['Z_Score']) > 3]
print(f"\nPotential outliers detected: {len(outliers)}")

# 3. Plotting (Code provided, requires GUI or notebook to view)
plt.figure(figsize=(10, 6))
sns.histplot(df['ClaimAmount'], bins=30, kde=True)
plt.title('Distribution of Claim Amounts')
plt.xlabel('Amount')
plt.savefig('claim_distribution.png') # Saving to file since no display
print("Saved distribution plot to claim_distribution.png")


# 1. Create target variable (Predict if Claim is Denied)
# Mapping Status to binary
df['IsDenied'] = (df['Status'] == 'Denied').astype(int)

# Features
X = df[['ClaimAmount', 'IsHighValue', 'ProviderID']]
y = df['IsDenied']

# 2. Train Model
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

clf = LogisticRegression()
clf.fit(X_train, y_train)

# 3. Prediction Probabilities
y_pred = clf.predict(X_test)
y_prob = clf.predict_proba(X_test)[:, 1]

# 4. Attach risk scores
df.loc[X_test.index, 'RiskScore'] = y_prob
# Fill training set with their risk scores as well for completeness
df.loc[X_train.index, 'RiskScore'] = clf.predict_proba(X_train)[:, 1]

print("\nModel evaluation:")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")
print("Top 5 highest risk claims:")
print(df.sort_values(by='RiskScore', ascending=False).head()[['ClaimID', 'ClaimAmount', 'Status', 'RiskScore']])

print("\nProject run complete.")
