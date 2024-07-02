/*
  Warnings:

  - You are about to drop the column `opinionId` on the `Result` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_opinionId_fkey";

-- AlterTable
ALTER TABLE "Inscription" ADD COLUMN     "opinionId" INTEGER;

-- AlterTable
ALTER TABLE "Result" DROP COLUMN "opinionId";

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_opinionId_fkey" FOREIGN KEY ("opinionId") REFERENCES "Opinion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
