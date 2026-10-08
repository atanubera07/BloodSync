ALTER TABLE "DonorProfile"
  ADD CONSTRAINT "DonorProfile_bloodGroup_check"
  CHECK ("bloodGroup" IN ('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'));

ALTER TABLE "BloodRequest"
  ADD CONSTRAINT "BloodRequest_bloodGroup_check"
  CHECK ("bloodGroup" IN ('O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'));
