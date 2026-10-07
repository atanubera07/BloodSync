CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TYPE "Role" AS ENUM ('USER','ADMIN');
CREATE TYPE "DonorStatus" AS ENUM ('PENDING','APPROVED','REJECTED');
CREATE TYPE "RequestStatus" AS ENUM ('OPEN','CLOSED','EXPIRED');
CREATE TYPE "EmailTokenKind" AS ENUM ('VERIFY','RESET');
CREATE TYPE "Urgency" AS ENUM ('NORMAL','URGENT');
CREATE TABLE "User" ("id" UUID PRIMARY KEY, "email" VARCHAR(254) NOT NULL UNIQUE, "passwordHash" TEXT NOT NULL, "fullName" VARCHAR(100) NOT NULL, "role" "Role" NOT NULL DEFAULT 'USER', "emailVerifiedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE "Session" ("id" UUID PRIMARY KEY, "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "tokenHash" TEXT NOT NULL UNIQUE, "expiresAt" TIMESTAMP(3) NOT NULL, "revokedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "Session_userId_revokedAt_idx" ON "Session"("userId","revokedAt");
CREATE TABLE "DonorProfile" ("id" UUID PRIMARY KEY, "userId" UUID NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE, "bloodGroup" VARCHAR(3) NOT NULL, "birthDate" DATE NOT NULL, "weightKg" DECIMAL(5,2) NOT NULL, "lastDonationAt" DATE, "city" VARCHAR(100) NOT NULL, "latitude" DECIMAL(9,6), "longitude" DECIMAL(9,6), "status" "DonorStatus" NOT NULL DEFAULT 'PENDING', "consentToMatch" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "DonorProfile_bloodGroup_status_consentToMatch_idx" ON "DonorProfile"("bloodGroup","status","consentToMatch");
CREATE TABLE "BloodRequest" ("id" UUID PRIMARY KEY, "ownerId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "bloodGroup" VARCHAR(3) NOT NULL, "units" INTEGER NOT NULL, "urgency" "Urgency" NOT NULL, "city" VARCHAR(100) NOT NULL, "latitude" DECIMAL(9,6), "longitude" DECIMAL(9,6), "expiresAt" TIMESTAMP(3) NOT NULL, "status" "RequestStatus" NOT NULL DEFAULT 'OPEN', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "BloodRequest_bloodGroup_status_expiresAt_idx" ON "BloodRequest"("bloodGroup","status","expiresAt");
CREATE INDEX "BloodRequest_ownerId_createdAt_idx" ON "BloodRequest"("ownerId","createdAt");
CREATE TABLE "AuditEvent" ("id" UUID PRIMARY KEY, "actorId" UUID, "action" VARCHAR(80) NOT NULL, "targetId" UUID, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId","createdAt");

CREATE TABLE "EmailToken" ("id" UUID PRIMARY KEY, "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "kind" "EmailTokenKind" NOT NULL, "tokenHash" TEXT NOT NULL UNIQUE, "expiresAt" TIMESTAMP(3) NOT NULL, "usedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX "EmailToken_userId_kind_usedAt_idx" ON "EmailToken"("userId","kind","usedAt");
