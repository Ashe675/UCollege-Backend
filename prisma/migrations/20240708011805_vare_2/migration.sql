/*
  Warnings:

  - Added the required column `regionalCenterId` to the `Inscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `processId` to the `Result` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inscription" ADD COLUMN     "regionalCenterId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "processId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_regionalCenterId_fkey" FOREIGN KEY ("regionalCenterId") REFERENCES "RegionalCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
