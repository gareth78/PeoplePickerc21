BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID(N'[dbo].[admins]', N'U') IS NULL
    BEGIN
        CREATE TABLE [dbo].[admins] (
            [id] uniqueidentifier NOT NULL,
            [email] nvarchar(255) NOT NULL,
            [username] nvarchar(255) NULL,
            [created_at] datetime2 NULL,
            [created_by] nvarchar(255) NULL,
            CONSTRAINT [PK_admins] PRIMARY KEY CLUSTERED ([id])
        );
    END

    IF COL_LENGTH(N'[dbo].[admins]', 'created_at') IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints
            WHERE parent_object_id = OBJECT_ID(N'[dbo].[admins]')
              AND name = N'DF_admins_created_at'
        )
        BEGIN
            ALTER TABLE [dbo].[admins]
            ADD CONSTRAINT [DF_admins_created_at] DEFAULT (SYSUTCDATETIME()) FOR [created_at];
        END
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID(N'[dbo].[admins]')
          AND name = N'DF_admins_id'
    )
    BEGIN
        ALTER TABLE [dbo].[admins]
        ADD CONSTRAINT [DF_admins_id] DEFAULT (NEWSEQUENTIALID()) FOR [id];
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'[dbo].[admins]')
          AND name = N'admins_email_key'
    )
    BEGIN
        CREATE UNIQUE INDEX [admins_email_key] ON [dbo].[admins]([email]);
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'[dbo].[admins]')
          AND name = N'admins_username_key'
    )
    BEGIN
        CREATE UNIQUE INDEX [admins_username_key]
            ON [dbo].[admins]([username])
            WHERE [username] IS NOT NULL;
    END

    IF OBJECT_ID(N'[dbo].[audit_logs]', N'U') IS NULL
    BEGIN
        CREATE TABLE [dbo].[audit_logs] (
            [id] uniqueidentifier NOT NULL,
            [action] nvarchar(100) NOT NULL,
            [admin_email] nvarchar(255) NOT NULL,
            [target_email] nvarchar(255) NULL,
            [ip_address] nvarchar(100) NULL,
            [user_agent] nvarchar(512) NULL,
            [metadata] nvarchar(4000) NULL,
            [created_at] datetime2 NOT NULL CONSTRAINT [DF_audit_logs_created_at] DEFAULT (SYSUTCDATETIME()),
            CONSTRAINT [PK_audit_logs] PRIMARY KEY CLUSTERED ([id])
        );
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.default_constraints
        WHERE parent_object_id = OBJECT_ID(N'[dbo].[audit_logs]')
          AND name = N'DF_audit_logs_id'
    )
    BEGIN
        ALTER TABLE [dbo].[audit_logs]
        ADD CONSTRAINT [DF_audit_logs_id] DEFAULT (NEWSEQUENTIALID()) FOR [id];
    END

    IF COL_LENGTH(N'[dbo].[audit_logs]', 'created_at') IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM sys.default_constraints
            WHERE parent_object_id = OBJECT_ID(N'[dbo].[audit_logs]')
              AND name = N'DF_audit_logs_created_at'
        )
        BEGIN
            ALTER TABLE [dbo].[audit_logs]
            ADD CONSTRAINT [DF_audit_logs_created_at] DEFAULT (SYSUTCDATETIME()) FOR [created_at];
        END
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'[dbo].[audit_logs]')
          AND name = N'audit_logs_admin_email_idx'
    )
    BEGIN
        CREATE INDEX [audit_logs_admin_email_idx] ON [dbo].[audit_logs]([admin_email]);
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'[dbo].[audit_logs]')
          AND name = N'audit_logs_action_idx'
    )
    BEGIN
        CREATE INDEX [audit_logs_action_idx] ON [dbo].[audit_logs]([action]);
    END

    IF NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'[dbo].[audit_logs]')
          AND name = N'audit_logs_created_at_idx'
    )
    BEGIN
        CREATE INDEX [audit_logs_created_at_idx] ON [dbo].[audit_logs]([created_at]);
    END

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage nvarchar(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity int = ERROR_SEVERITY();
    DECLARE @ErrorState int = ERROR_STATE();

    RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
END CATCH
