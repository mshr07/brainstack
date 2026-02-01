import pandas as pd
import numpy as np
from faker import Faker
import os
from datetime import datetime, timedelta
import random

# Configuration
NUM_PROVIDERS = 10000
NUM_MEMBERS = 100000
NUM_CLAIMS = 1000000
OUTPUT_DIR = 'data'
SEED = 42

np.random.seed(SEED)
fake = Faker()
Faker.seed(SEED)

def generate_providers(n):
    print(f"Generating {n} providers...")
    ids = np.arange(1, n + 1)
    # Generate batch data for speed
    govt_programs = ['Medicare', 'Medicaid', 'Commercial', 'Dual']
    specs = ['Internal Medicine', 'Family Practice', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Radiology', 'Surgery', 'Emergency']
    
    # Weights for specialty to make it realistic
    spec_weights = [0.3, 0.25, 0.1, 0.1, 0.1, 0.05, 0.05, 0.05]
    
    data = {
        'provider_id': ids,
        'npi': [fake.unique.random_number(digits=10, fix_len=True) for _ in range(n)],
        'provider_name': [fake.company() for _ in range(n)],
        'specialty': np.random.choice(specs, n, p=spec_weights),
        'provider_type': np.random.choice(['Individual', 'Facility'], n, p=[0.7, 0.3]),
        'city': [fake.city() for _ in range(n)],
        'state': [fake.state_abbr() for _ in range(n)]
    }
    df = pd.DataFrame(data)
    return df

def generate_members(n):
    print(f"Generating {n} members...")
    ids = np.arange(1, n + 1)
    
    # Vectorized dates
    start_date = datetime(1940, 1, 1)
    dob_days = np.random.randint(0, 25000, n) # Up to ~70 years old
    dobs = [start_date + timedelta(days=int(x)) for x in dob_days]
    
    data = {
        'member_id': ids,
        'member_code': [fake.unique.bothify(text='MEM########') for _ in range(n)],
        'first_name': [fake.first_name() for _ in range(n)],
        'last_name': [fake.last_name() for _ in range(n)],
        'dob': dobs,
        'gender': np.random.choice(['M', 'F'], n),
        'state': [fake.state_abbr() for _ in range(n)],
        'plan_type': np.random.choice(['HMO', 'PPO', 'EPO', 'POS'], n, p=[0.4, 0.4, 0.1, 0.1])
    }
    df = pd.DataFrame(data)
    return df

def generate_claims(n, member_ids, provider_ids):
    print(f"Generating {n} base claims...")
    ids = np.arange(1, n + 1)
    
    sampled_members = np.random.choice(member_ids, n)
    sampled_providers = np.random.choice(provider_ids, n)
    
    start_date = datetime(2023, 1, 1)
    date_offsets = np.random.randint(0, 365*2, n)
    claim_dates = [start_date + timedelta(days=int(x)) for x in date_offsets]
    
    amounts = np.random.lognormal(mean=5.0, sigma=1.5, size=n)
    amounts = np.round(amounts, 2)
    
    statuses = np.random.choice(['PAID', 'DENIED', 'PENDING', 'P.PAY'], n, p=[0.85, 0.1, 0.03, 0.02])
    diag_pool = [f"D{i:03d}" for i in range(1000)]
    
    df = pd.DataFrame({
        'claim_id': ids,
        'member_id': sampled_members,
        'provider_id': sampled_providers,
        'claim_date': claim_dates,
        'diagnosis_code_1': np.random.choice(diag_pool, n),
        'diagnosis_code_2': np.where(np.random.random(n) < 0.3, np.random.choice(diag_pool, n), None),
        'diagnosis_code_3': np.where(np.random.random(n) < 0.1, np.random.choice(diag_pool, n), None),
        'claim_status': statuses,
        'total_billed_amount': amounts * 1.5,
        'total_allowed_amount': amounts,
        'total_paid_amount': np.where(statuses == 'PAID', amounts * 0.8, 0.0)
    })
    
    is_inpatient = np.random.random(n) < 0.05
    df.loc[is_inpatient, 'admission_date'] = df.loc[is_inpatient, 'claim_date']
    
    return df

def inject_duplicate_claims(df, n_duplicates=5000):
    print(f"Injecting {n_duplicates} duplicate claims...")
    # Select random claims to duplicate
    dupe_indices = np.random.choice(df.index, n_duplicates, replace=False)
    dupes = df.loc[dupe_indices].copy()
    
    # Assign new Claim IDs but keep everything else same
    max_id = df['claim_id'].max()
    dupes['claim_id'] = np.arange(max_id + 1, max_id + 1 + n_duplicates)
    
    # Flag in a way we can track if needed (internal logic), but for external analytics they look like dupes
    # We might slightly alter the date for some to make it 'suspiciously close' vs 'exact match'
    # 50% exact date match, 50% shifted by 1-2 days
    mask = np.random.random(n_duplicates) < 0.5
    if mask.any():
        dupes.loc[mask, 'claim_date'] += pd.to_timedelta(np.random.randint(1, 4, size=mask.sum()), unit='D')
    
    return pd.concat([df, dupes], ignore_index=True)

def inject_impossible_travel(claims_df, providers_df, members_df, n_cenarios=500):
    print(f"Injecting {n_cenarios} impossible travel scenarios...")
    # Scenario: Member seen by Provider A in State X, and Provider B in State Y on same day
    
    # 1. Pick random members
    target_members = np.random.choice(members_df['member_id'], n_cenarios)
    
    # 2. Get two providers in different states
    # Efficient way: Shuffle providers and pick two sets
    p1 = providers_df.sample(n_cenarios, replace=True).reset_index(drop=True)
    p2 = providers_df.sample(n_cenarios, replace=True).reset_index(drop=True)
    
    # Ensure states are different
    # This is rough, for dummy data good enough.
    
    new_claims = []
    max_id = claims_df['claim_id'].max()
    
    start_date = datetime(2023, 6, 1)
    
    for i in range(n_cenarios):
        # Create 2 claims
        m_id = target_members[i]
        date = start_date + timedelta(days=np.random.randint(0, 100))
        
        c1 = {
            'claim_id': max_id + 1 + (i*2),
            'member_id': m_id,
            'provider_id': p1.iloc[i]['provider_id'],
            'claim_date': date,
            'diagnosis_code_1': 'D001',
            'claim_status': 'PAID',
            'total_billed_amount': 150.00,
            'total_allowed_amount': 100.00,
            'total_paid_amount': 80.00
        }
        
        c2 = {
            'claim_id': max_id + 2 + (i*2),
            'member_id': m_id,
            'provider_id': p2.iloc[i]['provider_id'],
            'claim_date': date, # Same date!
            'diagnosis_code_1': 'D001',
            'claim_status': 'PAID',
            'total_billed_amount': 200.00,
            'total_allowed_amount': 120.00,
            'total_paid_amount': 90.00
        }
        new_claims.extend([c1, c2])
        
    df_travel = pd.DataFrame(new_claims)
    return pd.concat([claims_df, df_travel], ignore_index=True)

def inject_high_velocity(claims_df, n_providers=50):
    print(f"Injecting high velocity for {n_providers} providers...")
    # Provider bills for > 50 patients in a single day
    
    target_providers = np.random.choice(claims_df['provider_id'].unique(), n_providers)
    
    max_id = claims_df['claim_id'].max()
    new_claims = []
    
    counter = 1
    for pid in target_providers:
        # Pick a specialized day
        spike_date = datetime(2023, 9, 15)
        
        # Generator 60 claims for this day
        for j in range(60):
            c = {
                'claim_id': max_id + counter,
                'member_id': np.random.randint(1, NUM_MEMBERS), # Random member
                'provider_id': pid,
                'claim_date': spike_date,
                'diagnosis_code_1': 'D999',
                'claim_status': 'PAID',
                'total_billed_amount': 100.00,
                'total_allowed_amount': 50.00,
                'total_paid_amount': 40.00
            }
            new_claims.append(c)
            counter += 1
            
    df_velocity = pd.DataFrame(new_claims)
    return pd.concat([claims_df, df_velocity], ignore_index=True)

def generate_procedures(claims_df):
    print("Generating procedures...")
    n_claims = len(claims_df)
    n_procs = np.random.randint(1, 4, n_claims)
    
    claim_ids = np.repeat(claims_df.claim_id.values, n_procs)
    n_total = len(claim_ids)
    print(f"  > Total procedure lines: {n_total}")
    
    proc_codes = [f"CPT{i:04d}" for i in range(100, 500)]
    amounts = np.random.lognormal(4.0, 1.0, n_total).round(2)
    
    df = pd.DataFrame({
        'claim_id': claim_ids,
        'procedure_code': np.random.choice(proc_codes, n_total),
        'line_number': 1,
        'billed_amount': amounts * 1.2,
        'allowed_amount': amounts,
        'paid_amount': amounts * 0.8
    })
    df['line_number'] = df.groupby('claim_id').cumcount() + 1
    return df

def generate_payments(claims_df):
    print("Generating payments...")
    paid_claims = claims_df[claims_df.total_paid_amount > 0].copy()
    n = len(paid_claims)
    
    lag = np.random.randint(15, 45, n)
    pay_dates = paid_claims['claim_date'] + pd.to_timedelta(lag, unit='D')
    
    df = pd.DataFrame({
        'claim_id': paid_claims['claim_id'],
        'payment_date': pay_dates,
        'check_number': [f"CHK{x:09d}" for x in range(n)],
        'payment_amount': paid_claims['total_paid_amount'],
        'payment_type': np.random.choice(['EFT', 'CHECK'], n, p=[0.9, 0.1])
    })
    return df

def main():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        
    providers = generate_providers(NUM_PROVIDERS)
    providers.to_csv(f'{OUTPUT_DIR}/providers.csv', index=False)
    
    members = generate_members(NUM_MEMBERS)
    members.to_csv(f'{OUTPUT_DIR}/members.csv', index=False)
    
    # 1. Base Claims
    claims = generate_claims(NUM_CLAIMS, members.member_id.values, providers.provider_id.values)
    
    # 2. Risk Injection
    claims = inject_duplicate_claims(claims, n_duplicates=2000)
    claims = inject_impossible_travel(claims, providers, members, n_cenarios=500)
    claims = inject_high_velocity(claims, n_providers=30)
    
    # Save Claims
    claims.to_csv(f'{OUTPUT_DIR}/claims.csv', index=False)
    
    # 3. Downstream
    procedures = generate_procedures(claims)
    procedures.to_csv(f'{OUTPUT_DIR}/procedures.csv', index=False)
    
    payments = generate_payments(claims)
    payments.to_csv(f'{OUTPUT_DIR}/payments.csv', index=False)
    
    print("Data generation with RISK SCENARIOS complete.")

    cwd = os.getcwd()
    data_path = os.path.join(cwd, OUTPUT_DIR)
    
    sql_script = f"""
    USE cotiviti_like_analytics;
    GO
    
    BULK INSERT dbo.providers FROM '{data_path}/providers.csv' WITH (FORMAT='CSV', FIRSTROW=2);
    BULK INSERT dbo.members FROM '{data_path}/members.csv' WITH (FORMAT='CSV', FIRSTROW=2);
    BULK INSERT dbo.claims FROM '{data_path}/claims.csv' WITH (FORMAT='CSV', FIRSTROW=2);
    BULK INSERT dbo.procedures FROM '{data_path}/procedures.csv' WITH (FORMAT='CSV', FIRSTROW=2);
    BULK INSERT dbo.payments FROM '{data_path}/payments.csv' WITH (FORMAT='CSV', FIRSTROW=2);
    GO
    """
    
    with open(f'{OUTPUT_DIR}/load_data.sql', 'w') as f:
        f.write(sql_script)

if __name__ == "__main__":
    main()
