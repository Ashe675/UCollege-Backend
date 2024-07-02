-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "opinionId" INTEGER,
ALTER COLUMN "message" SET DATA TYPE VARCHAR(18);

-- CreateTable
CREATE TABLE "Opinion" (
    "id" SERIAL NOT NULL,
    "message" VARCHAR(90) NOT NULL,

    CONSTRAINT "Opinion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_opinionId_fkey" FOREIGN KEY ("opinionId") REFERENCES "Opinion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
