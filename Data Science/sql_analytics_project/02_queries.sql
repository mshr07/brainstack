-- PART 2: SQL ANALYTICS QUERIES

USE claims_db;
GO

-- 1. Provider-level aggregations
SELECT 
    p.ProviderName,
    COUNT(c.ClaimID) AS TotalClaims,
    SUM(c.ClaimAmount) AS TotalBilled,
    AVG(c.ClaimAmount) AS AvgClaimAmount
FROM dbo.Claims c
JOIN dbo.Providers p ON c.ProviderID = p.ProviderID
GROUP BY p.ProviderName
ORDER BY TotalBilled DESC;
GO

-- 2. Monthly claim trends
SELECT 
    FORMAT(ClaimDate, 'yyyy-MM') AS ClaimMonth,
    COUNT(*) AS ClaimCount,
    SUM(ClaimAmount) AS TotalAmount
FROM dbo.Claims
GROUP BY FORMAT(ClaimDate, 'yyyy-MM')
ORDER BY ClaimMonth;
GO

-- 3. High-value claim detection (e.g., > $2000)
SELECT *
FROM dbo.Claims
WHERE ClaimAmount > 2000
ORDER BY ClaimAmount DESC;
GO

-- 4. Top N claims per provider using window functions (Top 3)
WITH RankedClaims AS (
    SELECT 
        ProviderID,
        ClaimID,
        ClaimAmount,
        ROW_NUMBER() OVER (PARTITION BY ProviderID ORDER BY ClaimAmount DESC) AS RankNum
    FROM dbo.Claims
)
SELECT 
    p.ProviderName,
    rc.ClaimAmount,
    rc.RankNum
FROM RankedClaims rc
JOIN dbo.Providers p ON rc.ProviderID = p.ProviderID
WHERE rc.RankNum <= 3;
GO
