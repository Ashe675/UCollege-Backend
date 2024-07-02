-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "dni" VARCHAR(10) NOT NULL,
    "firstName" VARCHAR(45) NOT NULL,
    "middleName" VARCHAR(45),
    "lastName" VARCHAR(45) NOT NULL,
    "secondLastName" VARCHAR(45),
    "phoneNumber" VARCHAR(9) NOT NULL,
    "email" VARCHAR(100) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Career" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" VARCHAR(100),
    "code" VARCHAR(45) NOT NULL,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id" SERIAL NOT NULL,
    "principalCareerId" INTEGER NOT NULL,
    "secondaryCareerId" INTEGER NOT NULL,
    "photoCertificate" VARCHAR(300) NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personId" INTEGER NOT NULL,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTest" (
    "id" SERIAL NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "name" VARCHAR(75) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdmissionTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTest_Career" (
    "id" SERIAL NOT NULL,
    "admissionTestId" INTEGER NOT NULL,
    "careerId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AdmissionTest_Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" SERIAL NOT NULL,
    "inscriptionId" INTEGER NOT NULL,
    "admissionTestId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "message" VARCHAR(45) NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "Person_dni_key" ON "Person"("dni");

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
CREATE INDEX "fk_AdmissionTest_has_Career_Career1_idx" ON "AdmissionTest_Career"("careerId");

-- CreateIndex
CREATE INDEX "fk_AdmissionTest_has_Career_AdmissionTest1_idx" ON "AdmissionTest_Career"("admissionTestId");

-- CreateIndex
CREATE INDEX "fk_Inscription_has_AdmissionTest_AdmissionTest1_idx" ON "Result"("admissionTestId");

-- CreateIndex
CREATE INDEX "fk_Inscription_has_AdmissionTest_Inscription1_idx" ON "Result"("inscriptionId");

-- CreateIndex
CREATE INDEX "fk_Town_CountryDepartment1_idx" ON "Town"("countryDepartmentId");

-- CreateIndex
CREATE INDEX "fk_RegionalCenter_Town1_idx" ON "RegionalCenter"("townId");

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