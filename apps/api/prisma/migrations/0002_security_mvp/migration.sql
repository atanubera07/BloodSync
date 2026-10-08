ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "lockedUntil" TIMESTAMP(3);
ALTER TABLE "DonorProfile" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "BloodRequest" ADD COLUMN "hospitalName" VARCHAR(120) NOT NULL;
CREATE TABLE "RequestInterest" (
  "id" UUID PRIMARY KEY,
  "requestId" UUID NOT NULL REFERENCES "BloodRequest"("id") ON DELETE CASCADE,
  "donorId" UUID NOT NULL REFERENCES "DonorProfile"("id") ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "consentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "RequestInterest_requestId_donorId_key" ON "RequestInterest"("requestId", "donorId");
CREATE INDEX "RequestInterest_userId_consentAt_idx" ON "RequestInterest"("userId", "consentAt");
CREATE INDEX "DonorProfile_location_gist" ON "DonorProfile" USING GIST ((ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography)) WHERE "longitude" IS NOT NULL AND "latitude" IS NOT NULL;
CREATE INDEX "BloodRequest_location_gist" ON "BloodRequest" USING GIST ((ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography)) WHERE "longitude" IS NOT NULL AND "latitude" IS NOT NULL;
