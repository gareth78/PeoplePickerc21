-- CreateTable
CREATE TABLE [dbo].[configurations] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [key] NVARCHAR(255) NOT NULL,
    [value] NVARCHAR(max) NOT NULL,
    [category] NVARCHAR(50) NOT NULL,
    [encrypted] BIT NOT NULL CONSTRAINT [configurations_encrypted_df] DEFAULT 0,
    [enabled] BIT NOT NULL CONSTRAINT [configurations_enabled_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [configurations_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(255),
    CONSTRAINT [configurations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [configurations_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[office_tenancies] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [name] NVARCHAR(255) NOT NULL,
    [tenantId] NVARCHAR(255) NOT NULL,
    [clientId] NVARCHAR(255) NOT NULL,
    [clientSecret] NVARCHAR(max) NOT NULL,
    [enabled] BIT NOT NULL CONSTRAINT [office_tenancies_enabled_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [office_tenancies_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    [created_by] NVARCHAR(255),
    CONSTRAINT [office_tenancies_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [office_tenancies_tenantId_key] UNIQUE NONCLUSTERED ([tenantId])
);

-- CreateTable
CREATE TABLE [dbo].[smtp_domains] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [domain] NVARCHAR(255) NOT NULL,
    [tenancy_id] UNIQUEIDENTIFIER NOT NULL,
    [priority] INT NOT NULL CONSTRAINT [smtp_domains_priority_df] DEFAULT 0,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [smtp_domains_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL,
    CONSTRAINT [smtp_domains_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [smtp_domains_domain_key] UNIQUE NONCLUSTERED ([domain])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [configurations_category_idx] ON [dbo].[configurations]([category]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [configurations_enabled_idx] ON [dbo].[configurations]([enabled]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [smtp_domains_tenancy_id_idx] ON [dbo].[smtp_domains]([tenancy_id]);

-- AddForeignKey
ALTER TABLE [dbo].[smtp_domains] ADD CONSTRAINT [smtp_domains_tenancy_id_fkey] FOREIGN KEY ([tenancy_id]) REFERENCES [dbo].[office_tenancies]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
