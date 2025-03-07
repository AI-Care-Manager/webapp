/*
  Warnings:

  - The values [ADMIN,HEALTH_WORKER,FAMILY] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubRole" AS ENUM ('FINANCE_MANAGER', 'HR_MANAGER', 'CARE_MANAGER', 'SCHEDULING_COORDINATOR', 'OFFICE_ADMINISTRATOR', 'RECEPTIONIST', 'QUALITY_ASSURANCE_MANAGER', 'MARKETING_COORDINATOR', 'COMPLIANCE_OFFICER', 'CAREGIVER', 'SENIOR_CAREGIVER', 'JUNIOR_CAREGIVER', 'TRAINEE_CAREGIVER', 'LIVE_IN_CAREGIVER', 'PART_TIME_CAREGIVER', 'SPECIALIZED_CAREGIVER', 'NURSING_ASSISTANT', 'SERVICE_USER', 'FAMILY_AND_FRIENDS', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('SOFTWARE_OWNER', 'OFFICE_STAFF', 'CARE_WORKER', 'CLIENT');
ALTER TABLE "Invitation" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "subRole" "SubRole";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subRole" "SubRole";
