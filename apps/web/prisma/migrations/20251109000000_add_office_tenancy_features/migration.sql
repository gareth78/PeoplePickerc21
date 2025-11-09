-- AlterTable: Add feature flag columns to office_tenancies
ALTER TABLE [dbo].[office_tenancies] ADD 
    [enable_presence] BIT NOT NULL CONSTRAINT [office_tenancies_enable_presence_df] DEFAULT 1,
    [enable_photos] BIT NOT NULL CONSTRAINT [office_tenancies_enable_photos_df] DEFAULT 1,
    [enable_out_of_office] BIT NOT NULL CONSTRAINT [office_tenancies_enable_out_of_office_df] DEFAULT 1,
    [enable_local_groups] BIT NOT NULL CONSTRAINT [office_tenancies_enable_local_groups_df] DEFAULT 0,
    [enable_global_groups] BIT NOT NULL CONSTRAINT [office_tenancies_enable_global_groups_df] DEFAULT 0;
