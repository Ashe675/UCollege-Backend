/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `AdmissionTest` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `AdmissionTest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AdmissionTest" ADD COLUMN     "code" VARCHAR(7) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionTest_code_key" ON "AdmissionTest"("code");
