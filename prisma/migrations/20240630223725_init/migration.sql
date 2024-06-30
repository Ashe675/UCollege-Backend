-- CreateTable
CREATE TABLE "Result" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Result_message_key" ON "Result"("message");
