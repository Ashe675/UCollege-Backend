/*
  Warnings:

  - You are about to alter the column `message` on the `Result` table. The data in that column could be lost. The data in that column will be cast from `VarChar(45)` to `VarChar(11)`.
  - A unique constraint covering the columns `[phoneNumber]` on the table `Person` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Person` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Person" ALTER COLUMN "dni" SET DATA TYPE VARCHAR(13),
ALTER COLUMN "phoneNumber" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "Result" ALTER COLUMN "message" SET DATA TYPE VARCHAR(11);

-- CreateIndex
CREATE UNIQUE INDEX "Person_phoneNumber_key" ON "Person"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");
