/*
  Warnings:

  - You are about to drop the column `minScore` on the `AdmissionTest_Career` table. All the data in the column will be lost.
  - The primary key for the `Result` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `score` on table `Result` required. This step will fail if there are existing NULL values in that column.
  - Made the column `date` on table `Result` required. This step will fail if there are existing NULL values in that column.
  - Made the column `message` on table `Result` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "AdmissionTest_Career" DROP COLUMN "minScore";

-- AlterTable
ALTER TABLE "Result" DROP CONSTRAINT "Result_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "score" SET NOT NULL,
ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "message" SET NOT NULL,
ALTER COLUMN "message" SET DATA TYPE VARCHAR(45),
ADD CONSTRAINT "Result_pkey" PRIMARY KEY ("id");
