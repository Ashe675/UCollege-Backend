import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Insertar datos en la tabla Person
    /**
     * 
    const person = await prisma.person.create({
      data: {
        dni: '1234567890123',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890',
        email: 'john.doe@example.com',
      },
    });
    
    console.log('Person created:', person);
    */

    // Insertar datos en la tabla Career
    const career = await prisma.career.create({
      data: {
        name: 'Ingenieria En sistemas',
        active: true,
        description: 'estudia para ser el god de todos',
        code: 'IS001',
      },
    });

    console.log('Career created:', career);

    const career2 = await prisma.career.create({
      data: {
        name: 'Medicina',
        active: true,
        description: 'Dr. chopper',
        code: 'MS001',
      },
    });

    console.log('Career created:', career2);

    const career3 = await prisma.career.create({
      data: {
        name: 'Derecho',
        active: true,
        description: 'No los quiero',
        code: 'DE001',
      },
    });

    console.log('Career created:', career3);
    /**
     * 
    // Insertar datos en la tabla Inscription
    const inscription = await prisma.inscription.create({
      data: {
        principalCareerId: career.id,
        secondaryCareerId: career.id + 1, // Ejemplo: suponiendo que hay dos carreras
        photoCertificate: '/path/to/photo.jpg',
        personId: person.id,
      },
    });
    
    console.log('Inscription created:', inscription);
    */

    // Insertar datos en la tabla AdmissionTest
    const admissionTest = await prisma.admissionTest.create({
      data: {
        minScoreApprove: 600,
        score: 1800,
        name: 'Prueba de aptitud',
        active: true,
        code: 'PAA',
      },
    });

    console.log('Admission Test created:', admissionTest);

    const admissionTest2 = await prisma.admissionTest.create({
      data: {
        minScoreApprove: 0,
        score: 1000,
        name: 'Prueba de salud y ciencias',
        active: true,
        code: 'PCCNS',
      },
    });

    console.log('Admission Test created:', admissionTest2);

    const admissionTest3 = await prisma.admissionTest.create({
      data: {
        minScoreApprove: 0,
        score: 1000,
        name: 'Prueba de conocimiento matematico',
        active: true,
        code: 'PAM',
      },
    });

    console.log('Admission Test created:', admissionTest3);

    //==========================================================================================================

    // Insertar datos en la tabla AdmissionTest_Career
    const admissionTestCareerI1 = await prisma.admissionTest_Career.create({
      data: {
        admissionTestId: admissionTest.id,//PAA
        careerId: career.id,//IS
        active: true,
        minScore: 1000,
      },
    });

    console.log('Admission Test Career created:', admissionTestCareerI1);
    
    const admissionTestCareerI2 = await prisma.admissionTest_Career.create({
      data: {
        admissionTestId: admissionTest3.id,//PAM
        careerId: career.id,//IS
        active: true,
        minScore: 500,
      },
    });

    console.log('Admission Test Career created:', admissionTestCareerI2);

    const admissionTestCareerM1 = await prisma.admissionTest_Career.create({
      data: {
        admissionTestId: admissionTest.id,//PAA
        careerId: career2.id,//MEDICINA
        active: true,
        minScore: 1100,
      },
    });

    console.log('Admission Test Career created:', admissionTestCareerM1);

    const admissionTestCareerM2 = await prisma.admissionTest_Career.create({
      data: {
        admissionTestId: admissionTest2.id,//PCCNS
        careerId: career2.id,//MEDICINA
        active: true,
        minScore: 700,
      },
    });

    console.log('Admission Test Career created:', admissionTestCareerM2);

    const admissionTestCareerD = await prisma.admissionTest_Career.create({
      data: {
        admissionTestId: admissionTest.id,//PAA
        careerId: career3.id,//Derecho
        active: true,
        minScore: 700,
      },
    });

    console.log('Admission Test Career created:', admissionTestCareerD);

    /**
    // Insertar datos en la tabla Opinion
    const opinion = await prisma.opinion.create({
      data: {
        message: 'This is an opinion message.',
      },
    });

    console.log('Opinion created:', opinion);

    // Insertar datos en la tabla Result
     * 
    const result = await prisma.result.create({
      data: {
        inscriptionId: inscription.id,
        admissionTestId: admissionTest.id,
        score: 80.0,
        message: 'Passed admission test',
      },
    });
    
    console.log('Result created:', result);
    */

    // Insertar datos en otras tablas según sea necesario...

  } catch (error) {
    console.error('Error creating data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Script error:', error);
});
