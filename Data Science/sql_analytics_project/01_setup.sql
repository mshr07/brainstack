-- PART 1: SQL SERVER SETUP

USE master;
GO

IF NOT EXISTS(SELECT * FROM sys.databases WHERE name = 'claims_db')
BEGIN
    CREATE DATABASE claims_db;
END
GO

USE claims_db;
GO

-- Create Providers Table
IF OBJECT_ID('dbo.Providers', 'U') IS NOT NULL DROP TABLE dbo.Providers;
CREATE TABLE dbo.Providers (
    ProviderID INT PRIMARY KEY,
    ProviderName VARCHAR(100),
    Specialty VARCHAR(50),
    Region VARCHAR(50)
);
GO

-- Create Claims Table
IF OBJECT_ID('dbo.Claims', 'U') IS NOT NULL DROP TABLE dbo.Claims;
CREATE TABLE dbo.Claims (
    ClaimID INT PRIMARY KEY,
    ProviderID INT,
    PatientID INT,
    ClaimDate DATE,
    ClaimAmount DECIMAL(18, 2),
    DiagnosisCode VARCHAR(10),
    Status VARCHAR(20),
    FOREIGN KEY (ProviderID) REFERENCES dbo.Providers(ProviderID)
);
GO

-- Insert Dummy Data (Providers)
INSERT INTO dbo.Providers (ProviderID, ProviderName, Specialty, Region)
VALUES 
(1, 'General Hospital', 'General', 'North'),
(2, 'City Clinic', 'Family Medicine', 'South'),
(3, 'Heart Center', 'Cardiology', 'East'),
(4, 'Ortho Care', 'Orthopedics', 'West'),
(5, 'Main Street GP', 'General', 'North');
GO

-- Insert Dummy Data (Claims - Generating 100+ rows)
DECLARE @i INT = 1;
WHILE @i <= 150
BEGIN
    INSERT INTO dbo.Claims (ClaimID, ProviderID, PatientID, ClaimDate, ClaimAmount, DiagnosisCode, Status)
    VALUES (
        @i,
        ABS(CHECKSUM(NEWID()) % 5) + 1,        -- Random ProviderID 1-5
        ABS(CHECKSUM(NEWID()) % 1000) + 1,     -- Random PatientID
        DATEADD(DAY, -ABS(CHECKSUM(NEWID()) % 365), GETDATE()), -- Random Date last 365 days
        ABS(CHECKSUM(NEWID()) % 500000) / 100.0 + 50, -- Random Amount 50.00 to 5050.00
        CASE ABS(CHECKSUM(NEWID()) % 4) 
            WHEN 0 THEN 'J01.90' 
            WHEN 1 THEN 'I10' 
            WHEN 2 THEN 'E11.9' 
            ELSE 'M54.5' 
        END,
        CASE ABS(CHECKSUM(NEWID()) % 10)
            WHEN 0 THEN 'Denied'
            ELSE 'Paid'
        END
    );
    SET @i = @i + 1;
END
GO
