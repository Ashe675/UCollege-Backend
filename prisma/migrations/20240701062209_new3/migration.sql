/*
  Warnings:

  - You are about to drop the column `date` on the `AdmissionTest` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `AdmissionTest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(75)`.
  - You are about to alter the column `name` on the `Career` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to drop the column `Career_id` on the `Inscription` table. All the data in the column will be lost.
  - You are about to drop the column `Person_id` on the `Inscription` table. All the data in the column will be lost.
  - You are about to drop the column `birthDate` on the `Person` table. All the data in the column will be lost.
  - You are about to alter the column `firstName` on the `Person` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(45)`.
  - You are about to alter the column `lastName` on the `Person` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(45)`.
  - You are about to alter the column `email` on the `Person` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the column `AdmissionTest_id` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the column `Inscription_id` on the `Result` table. All the data in the column will be lost.
  - You are about to drop the `AdmissionTestCareer` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `Career` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[dni]` on the table `Person` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `score` to the `AdmissionTest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Career` table without a default value. This is not possible if the table is not empty.
  - Added the required column `personId` to the `Inscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `photoCertificate` to the `Inscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `principalCareerId` to the `Inscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secondaryCareerId` to the `Inscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dni` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `Person` table without a default value. This is not possible if the table is not empty.
  - Added the required column `admissionTestId` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inscriptionId` to the `Result` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `Result` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AdmissionTestCareer" DROP CONSTRAINT "AdmissionTestCareer_AdmissionTest_id_fkey";

-- DropForeignKey
ALTER TABLE "AdmissionTestCareer" DROP CONSTRAINT "AdmissionTestCareer_Career_id_fkey";

-- DropForeignKey
ALTER TABLE "Inscription" DROP CONSTRAINT "Inscription_Career_id_fkey";

-- DropForeignKey
ALTER TABLE "Inscription" DROP CONSTRAINT "Inscription_Person_id_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_AdmissionTest_id_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_Inscription_id_fkey";

-- DropIndex
DROP INDEX "Person_email_key";

-- AlterTable
ALTER TABLE "AdmissionTest" DROP COLUMN "date",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "score" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(75);

-- AlterTable
ALTER TABLE "Career" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "code" VARCHAR(45) NOT NULL,
ADD COLUMN     "createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" VARCHAR(100),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "Inscription" DROP COLUMN "Career_id",
DROP COLUMN "Person_id",
ADD COLUMN     "personId" INTEGER NOT NULL,
ADD COLUMN     "photoCertificate" VARCHAR(300) NOT NULL,
ADD COLUMN     "principalCareerId" INTEGER NOT NULL,
ADD COLUMN     "secondaryCareerId" INTEGER NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "date" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "Person" DROP COLUMN "birthDate",
ADD COLUMN     "dni" VARCHAR(10) NOT NULL,
ADD COLUMN     "middleName" VARCHAR(45),
ADD COLUMN     "phoneNumber" VARCHAR(9) NOT NULL,
ADD COLUMN     "secondLastName" VARCHAR(45),
ALTER COLUMN "firstName" SET DATA TYPE VARCHAR(45),
ALTER COLUMN "lastName" SET DATA TYPE VARCHAR(45),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "Result" DROP COLUMN "AdmissionTest_id",
DROP COLUMN "Inscription_id",
ADD COLUMN     "admissionTestId" INTEGER NOT NULL,
ADD COLUMN     "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "inscriptionId" INTEGER NOT NULL,
ADD COLUMN     "message" VARCHAR(45) NOT NULL;

-- DropTable
DROP TABLE "AdmissionTestCareer";

-- CreateTable
CREATE TABLE "AdmissionTest_Career" (
    "id" SERIAL NOT NULL,
    "admissionTestId" INTEGER NOT NULL,
    "careerId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdmissionTest_Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryDepartment" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(85) NOT NULL,

    CONSTRAINT "CountryDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Town" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "countryDepartmentId" INTEGER NOT NULL,

    CONSTRAINT "Town_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegionalCenter" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "date" DATE NOT NULL,
    "RegionalCentercol" VARCHAR(45) NOT NULL,
    "finalDate" DATE,
    "townId" INTEGER NOT NULL,

    CONSTRAINT "RegionalCenter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fk_AdmissionTest_has_Career_Career1_idx" ON "AdmissionTest_Career"("careerId");

-- CreateIndex
CREATE INDEX "fk_AdmissionTest_has_Career_AdmissionTest1_idx" ON "AdmissionTest_Career"("admissionTestId");

-- CreateIndex
CREATE INDEX "fk_Town_CountryDepartment1_idx" ON "Town"("countryDepartmentId");

-- CreateIndex
CREATE INDEX "fk_RegionalCenter_Town1_idx" ON "RegionalCenter"("townId");

-- CreateIndex
CREATE UNIQUE INDEX "Career_code_key" ON "Career"("code");

-- CreateIndex
CREATE INDEX "pk_Career_idx" ON "Career"("id");

-- CreateIndex
CREATE INDEX "fk_Inscription_Career1_idx" ON "Inscription"("principalCareerId");

-- CreateIndex
CREATE INDEX "fk_Inscription_Career2_idx" ON "Inscription"("secondaryCareerId");

-- CreateIndex
CREATE INDEX "fk_Inscription_Person1_idx" ON "Inscription"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_dni_key" ON "Person"("dni");

-- CreateIndex
CREATE INDEX "fk_Inscription_has_AdmissionTest_AdmissionTest1_idx" ON "Result"("admissionTestId");

-- CreateIndex
CREATE INDEX "fk_Inscription_has_AdmissionTest_Inscription1_idx" ON "Result"("inscriptionId");

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_principalCareerId_fkey" FOREIGN KEY ("principalCareerId") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_secondaryCareerId_fkey" FOREIGN KEY ("secondaryCareerId") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTest_Career" ADD CONSTRAINT "AdmissionTest_Career_admissionTestId_fkey" FOREIGN KEY ("admissionTestId") REFERENCES "AdmissionTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTest_Career" ADD CONSTRAINT "AdmissionTest_Career_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_admissionTestId_fkey" FOREIGN KEY ("admissionTestId") REFERENCES "AdmissionTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Town" ADD CONSTRAINT "Town_countryDepartmentId_fkey" FOREIGN KEY ("countryDepartmentId") REFERENCES "CountryDepartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegionalCenter" ADD CONSTRAINT "RegionalCenter_townId_fkey" FOREIGN KEY ("townId") REFERENCES "Town"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
