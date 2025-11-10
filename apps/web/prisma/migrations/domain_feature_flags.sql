-- =====================================================================
-- Migration: Add Domain-Level Feature Flags and Update Tenancy Defaults
-- Date: 2025-11-10
-- Description: 
--   1. Add 5 nullable feature flag columns to smtp_domains table
--   2. Update tenancy defaults from TRUE to FALSE (execute manually if needed)
-- =====================================================================

-- Step 1: Add feature flag columns to smtp_domains
-- These are nullable (NULL = inherit from tenancy)
ALTER TABLE [dbo].[smtp_domains] ADD 
    enable_presence BIT NULL,
    enable_photos BIT NULL,
    enable_out_of_office BIT NULL,
    enable_local_groups BIT NULL,
    enable_global_groups BIT NULL;

GO

-- Step 2: Verify columns were added
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'smtp_domains' 
AND COLUMN_NAME LIKE 'enable%'
ORDER BY ORDINAL_POSITION;

GO

-- =====================================================================
-- IMPORTANT: Tenancy Default Update
-- =====================================================================
-- The following updates change tenancy defaults from TRUE to FALSE.
-- This is a BREAKING CHANGE and should be reviewed before execution.
-- If you have existing tenancies, you may want to skip this step
-- or manually review each tenancy's settings.
--
-- Uncomment the following lines ONLY if you want to change defaults:

-- UPDATE [dbo].[office_tenancies]
-- SET 
--     enable_presence = 0,
--     enable_photos = 0,
--     enable_out_of_office = 0
-- WHERE 
--     enable_presence IS NOT NULL OR
--     enable_photos IS NOT NULL OR
--     enable_out_of_office IS NOT NULL;
--
-- Note: enable_local_groups and enable_global_groups already default to FALSE

GO

-- =====================================================================
-- Verification Queries
-- =====================================================================

-- Check domain feature flags
SELECT 
    domain,
    enable_presence,
    enable_photos,
    enable_out_of_office,
    enable_local_groups,
    enable_global_groups
FROM [dbo].[smtp_domains];

GO

-- Check tenancy feature flags
SELECT 
    name,
    enable_presence,
    enable_photos,
    enable_out_of_office,
    enable_local_groups,
    enable_global_groups
FROM [dbo].[office_tenancies];

GO
