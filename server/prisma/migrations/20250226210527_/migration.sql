/*
  Warnings:

  - Made the column `cognitoId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "cognitoId" SET NOT NULL;
