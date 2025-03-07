/*
  Warnings:

  - You are about to drop the column `locationId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_locationId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "locationId";

-- CreateTable
CREATE TABLE "_LocationToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_LocationToUser_B_index" ON "_LocationToUser"("B");

-- AddForeignKey
ALTER TABLE "_LocationToUser" ADD CONSTRAINT "_LocationToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationToUser" ADD CONSTRAINT "_LocationToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
