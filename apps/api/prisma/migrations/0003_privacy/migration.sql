CREATE TABLE "ConsentRecord" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "privacyVersion" VARCHAR(40) NOT NULL,
  "healthProcessing" BOOLEAN NOT NULL,
  "contactSharing" BOOLEAN NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "withdrawnAt" TIMESTAMP(3),
  CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ConsentRecord_userId_grantedAt_idx" ON "ConsentRecord"("userId", "grantedAt");
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD COLUMN "ipHash" VARCHAR(64), ADD COLUMN "result" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS';
