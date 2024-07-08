/*
  Warnings:

  - Added the required column `regionalCenterId` to the `Inscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inscription" ADD COLUMN     "regionalCenterId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "fk_Inscription_RegionalCenter1_idx" ON "Inscription"("regionalCenterId");

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_regionalCenterId_fkey" FOREIGN KEY ("regionalCenterId") REFERENCES "RegionalCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
