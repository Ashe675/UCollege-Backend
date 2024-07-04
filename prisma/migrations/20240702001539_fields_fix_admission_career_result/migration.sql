/*
  Warnings:

  - Added the required column `minScore` to the `AdmissionTest_Career` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AdmissionTest_Career" ADD COLUMN     "minScore" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Result" ALTER COLUMN "score" DROP NOT NULL,
ALTER COLUMN "message" DROP NOT NULL,
ALTER COLUMN "date" DROP NOT NULL,
ALTER COLUMN "date" DROP DEFAULT;
