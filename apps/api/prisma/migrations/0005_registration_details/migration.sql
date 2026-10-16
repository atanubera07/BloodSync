ALTER TABLE "User"
  ADD COLUMN "phoneNumber" VARCHAR(24),
  ADD COLUMN "declaredBloodGroup" VARCHAR(3),
  ADD COLUMN "postalAddress" VARCHAR(250),
  ADD COLUMN "city" VARCHAR(100),
  ADD COLUMN "stateRegion" VARCHAR(100),
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
