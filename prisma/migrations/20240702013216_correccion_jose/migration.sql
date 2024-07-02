/*
  Warnings:

  - The primary key for the `Result` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Result` table. All the data in the column will be lost.
  - You are about to alter the column `message` on the `Result` table. The data in that column could be lost. The data in that column will be cast from `VarChar(45)` to `VarChar(11)`.
  - Added the required column `minScore` to the `AdmissionTest_Career` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AdmissionTest_Career" ADD COLUMN     "minScore" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Result" DROP CONSTRAINT "Result_pkey",
DROP COLUMN "id",
ALTER COLUMN "score" DROP NOT NULL,
ALTER COLUMN "date" DROP NOT NULL,
ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "message" DROP NOT NULL,
ALTER COLUMN "message" SET DATA TYPE VARCHAR(11),
ADD CONSTRAINT "Result_pkey" PRIMARY KEY ("inscriptionId", "admissionTestId");
