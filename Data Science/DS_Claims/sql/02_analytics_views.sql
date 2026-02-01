USE cotiviti_like_analytics;
GO

-----------------------------------------------------------
-- 1. PROVIDER METRICS VIEW
-----------------------------------------------------------
IF OBJECT_ID('dbo.vw_provider_analytics', 'V') IS NOT NULL DROP VIEW dbo.vw_provider_analytics;
GO

CREATE VIEW dbo.vw_provider_analytics AS
WITH ProviderStats AS (
    SELECT 
        p.provider_id,
        p.provider_name,
        p.specialty,
        COUNT(c.claim_id) AS total_claims,
        COUNT(DISTINCT c.member_id) AS total_patients,
        SUM(c.total_billed_amount) AS total_billed,
        AVG(c.total_billed_amount) AS avg_billed_per_claim,
        SUM(c.total_paid_amount) AS total_paid
    FROM dbo.providers p
    JOIN dbo.claims c ON p.provider_id = c.provider_id
    GROUP BY p.provider_id, p.provider_name, p.specialty
)
SELECT 
    *,
    RANK() OVER (PARTITION BY specialty ORDER BY avg_billed_per_claim DESC) as cost_rank_in_specialty,
    avg_billed_per_claim / NULLIF(AVG(avg_billed_per_claim) OVER (PARTITION BY specialty), 0) as cost_ratio_to_peer
FROM ProviderStats;
GO

-----------------------------------------------------------
-- 2. MEMBER RISK & COST VIEW
-----------------------------------------------------------
IF OBJECT_ID('dbo.vw_member_analytics', 'V') IS NOT NULL DROP VIEW dbo.vw_member_analytics;
GO

CREATE VIEW dbo.vw_member_analytics AS
SELECT 
    m.member_id,
    m.state,
    m.gender,
    DATEDIFF(YEAR, m.dob, GETDATE()) as age,
    COUNT(c.claim_id) AS claim_count,
    SUM(c.total_paid_amount) AS total_cost,
    MAX(c.claim_date) AS last_claim_date,
    SUM(CASE WHEN c.diagnosis_code_1 LIKE 'E%' THEN 1 ELSE 0 END) AS emergency_claims, -- Mock logic
    AVG(DATEDIFF(DAY, c.claim_date, c.discharge_date)) AS avg_los
FROM dbo.members m
LEFT JOIN dbo.claims c ON m.member_id = c.member_id
GROUP BY m.member_id, m.state, m.gender, m.dob;
GO

-----------------------------------------------------------
-- 3. SUSPICIOUS CLAIMS (ANOMALY DETECTION RULES)
-----------------------------------------------------------
-- Flags claims that are > 3 std devs above specialty average
IF OBJECT_ID('dbo.vw_suspicious_claims', 'V') IS NOT NULL DROP VIEW dbo.vw_suspicious_claims;
GO

CREATE VIEW dbo.vw_suspicious_claims AS
WITH SpecialtyStats AS (
    SELECT 
        p.specialty,
        AVG(c.total_billed_amount) as avg_billed,
        STDEV(c.total_billed_amount) as std_billed
    FROM dbo.claims c
    JOIN dbo.providers p ON c.provider_id = p.provider_id
    GROUP BY p.specialty
)
SELECT 
    c.claim_id,
    c.provider_id,
    p.specialty,
    c.total_billed_amount,
    s.avg_billed,
    s.std_billed,
    (c.total_billed_amount - s.avg_billed) / NULLIF(s.std_billed, 0) as z_score
FROM dbo.claims c
JOIN dbo.providers p ON c.provider_id = p.provider_id
JOIN SpecialtyStats s ON p.specialty = s.specialty
WHERE (c.total_billed_amount - s.avg_billed) > (3 * s.std_billed);
GO
