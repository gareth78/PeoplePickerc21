-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "admin_email" TEXT NOT NULL,
    "target_email" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_admin_email_idx" ON "audit_logs"("admin_email");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
