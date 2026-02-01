USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'cotiviti_like_analytics')
BEGIN
    CREATE DATABASE cotiviti_like_analytics;
END
GO

USE cotiviti_like_analytics;
GO

-- Cleanup existing tables if rerunning
IF OBJECT_ID('dbo.payments', 'U') IS NOT NULL DROP TABLE dbo.payments;
IF OBJECT_ID('dbo.procedures', 'U') IS NOT NULL DROP TABLE dbo.procedures;
IF OBJECT_ID('dbo.claims', 'U') IS NOT NULL DROP TABLE dbo.claims;
IF OBJECT_ID('dbo.members', 'U') IS NOT NULL DROP TABLE dbo.members;
IF OBJECT_ID('dbo.providers', 'U') IS NOT NULL DROP TABLE dbo.providers;
GO

-----------------------------------------------------------
-- 1. PROVIDERS
-----------------------------------------------------------
CREATE TABLE dbo.providers (
    provider_id INT PRIMARY KEY,
    npi VARCHAR(20) NOT NULL UNIQUE,
    provider_name VARCHAR(100),
    specialty VARCHAR(50),
    provider_type VARCHAR(50), -- e.g. Individual, Facility
    city VARCHAR(100),
    state VARCHAR(2),
    created_at DATETIME DEFAULT GETDATE()
);

-----------------------------------------------------------
-- 2. MEMBERS
-----------------------------------------------------------
CREATE TABLE dbo.members (
    member_id INT PRIMARY KEY,
    member_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    dob DATE,
    gender CHAR(1),
    state VARCHAR(2),
    plan_type VARCHAR(50), -- e.g. HMO, PPO
    created_at DATETIME DEFAULT GETDATE()
);

-----------------------------------------------------------
-- 3. CLAIMS
-----------------------------------------------------------
CREATE TABLE dbo.claims (
    claim_id BIGINT PRIMARY KEY,
    member_id INT NOT NULL,
    provider_id INT NOT NULL,
    claim_date DATE NOT NULL,
    admission_date DATE,
    discharge_date DATE,
    diagnosis_code_1 VARCHAR(10),
    diagnosis_code_2 VARCHAR(10),
    diagnosis_code_3 VARCHAR(10),
    claim_status VARCHAR(20), -- e.g. PAID, DENIED, PENDING
    total_billed_amount DECIMAL(18, 2),
    total_allowed_amount DECIMAL(18, 2),
    total_paid_amount DECIMAL(18, 2),
    FOREIGN KEY (member_id) REFERENCES dbo.members(member_id),
    FOREIGN KEY (provider_id) REFERENCES dbo.providers(provider_id)
);

CREATE INDEX idx_claims_member ON dbo.claims(member_id);
CREATE INDEX idx_claims_provider ON dbo.claims(provider_id);
CREATE INDEX idx_claims_date ON dbo.claims(claim_date);

-----------------------------------------------------------
-- 4. PROCEDURES
-----------------------------------------------------------
CREATE TABLE dbo.procedures (
    procedure_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    procedure_code VARCHAR(10) NOT NULL, -- CPT/HCPCS
    procedure_date DATE,
    line_number INT,
    billed_amount DECIMAL(18, 2),
    allowed_amount DECIMAL(18, 2),
    paid_amount DECIMAL(18, 2),
    FOREIGN KEY (claim_id) REFERENCES dbo.claims(claim_id)
);

CREATE INDEX idx_procedures_claim ON dbo.procedures(claim_id);

-----------------------------------------------------------
-- 5. PAYMENTS
-----------------------------------------------------------
CREATE TABLE dbo.payments (
    payment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    claim_id BIGINT NOT NULL,
    payment_date DATE,
    check_number VARCHAR(50),
    payment_amount DECIMAL(18, 2),
    payment_type VARCHAR(20), -- e.g. CHECK, EFT
    FOREIGN KEY (claim_id) REFERENCES dbo.claims(claim_id)
);

CREATE INDEX idx_payments_claim ON dbo.payments(claim_id);
GO
