BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[audit_logs] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [admin_email] NVARCHAR(1000) NOT NULL,
    [target_email] NVARCHAR(1000),
    [ip_address] NVARCHAR(1000),
    [user_agent] NVARCHAR(1000),
    [metadata] NVARCHAR(1000),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [audit_logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [audit_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_admin_email_idx] ON [dbo].[audit_logs]([admin_email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_action_idx] ON [dbo].[audit_logs]([action]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_created_at_idx] ON [dbo].[audit_logs]([created_at]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

