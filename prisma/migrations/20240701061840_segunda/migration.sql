/*
  Warnings:

  - You are about to drop the `Aspirante` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Aspirante";

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "Person_id" INTEGER NOT NULL,
    "Career_id" INTEGER NOT NULL,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" SERIAL NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "AdmissionTest_id" INTEGER NOT NULL,
    "Inscription_id" INTEGER NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTest" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AdmissionTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTestCareer" (
    "id" SERIAL NOT NULL,
    "AdmissionTest_id" INTEGER NOT NULL,
    "Career_id" INTEGER NOT NULL,

    CONSTRAINT "AdmissionTestCareer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Career" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_Person_id_fkey" FOREIGN KEY ("Person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_Career_id_fkey" FOREIGN KEY ("Career_id") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_AdmissionTest_id_fkey" FOREIGN KEY ("AdmissionTest_id") REFERENCES "AdmissionTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_Inscription_id_fkey" FOREIGN KEY ("Inscription_id") REFERENCES "Inscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTestCareer" ADD CONSTRAINT "AdmissionTestCareer_AdmissionTest_id_fkey" FOREIGN KEY ("AdmissionTest_id") REFERENCES "AdmissionTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdmissionTestCareer" ADD CONSTRAINT "AdmissionTestCareer_Career_id_fkey" FOREIGN KEY ("Career_id") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
