-- CreateTable
CREATE TABLE "Aspirante" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "fechaExamen" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aspirante_pkey" PRIMARY KEY ("id")
);
