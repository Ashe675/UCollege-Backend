-- CreateTable
CREATE TABLE "ProcessType" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(65) NOT NULL,

    CONSTRAINT "ProcessType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Process" (
    "id" SERIAL NOT NULL,
    "startDate" DATE NOT NULL,
    "finalDate" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "processTypeId" INTEGER NOT NULL,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "dni" VARCHAR(13) NOT NULL,
    "firstName" VARCHAR(45) NOT NULL,
    "middleName" VARCHAR(45),
    "lastName" VARCHAR(45) NOT NULL,
    "secondLastName" VARCHAR(45),
    "phoneNumber" VARCHAR(20) NOT NULL,
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
    "opinionId" INTEGER,
    "processId" INTEGER NOT NULL,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTest" (
    "id" SERIAL NOT NULL,
    "minScoreApprove" DOUBLE PRECISION,
    "score" DOUBLE PRECISION NOT NULL,
    "name" VARCHAR(75) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "code" VARCHAR(7) NOT NULL,

    CONSTRAINT "AdmissionTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionTest_Career" (
    "id" SERIAL NOT NULL,
    "admissionTestId" INTEGER NOT NULL,
    "careerId" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "minScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "AdmissionTest_Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opinion" (
    "id" SERIAL NOT NULL,
    "message" VARCHAR(90) NOT NULL,

    CONSTRAINT "Opinion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "inscriptionId" INTEGER NOT NULL,
    "admissionTestId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "message" VARCHAR(18),
    "date" DATE,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("inscriptionId","admissionTestId")
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
CREATE INDEX "fk_Process_ProcessType1_idx" ON "Process"("processTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_dni_key" ON "Person"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

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
CREATE INDEX "fk_Inscription_Process1_idx" ON "Inscription"("processId");

-- CreateIndex
CREATE UNIQUE INDEX "AdmissionTest_code_key" ON "AdmissionTest"("code");

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
ALTER TABLE "Process" ADD CONSTRAINT "Process_processTypeId_fkey" FOREIGN KEY ("processTypeId") REFERENCES "ProcessType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_principalCareerId_fkey" FOREIGN KEY ("principalCareerId") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_secondaryCareerId_fkey" FOREIGN KEY ("secondaryCareerId") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_opinionId_fkey" FOREIGN KEY ("opinionId") REFERENCES "Opinion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
