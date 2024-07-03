import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {


  // Crear una persona
  /**
   * 
  await prisma.person.create({
    data: {
      dni:"",
      email:"",
      firstName:"",
      
      lastName:"",
      phoneNumber:"",
      
    },
  });

  //crear Carrer

  */
  await prisma.career.create({
    data:{
      id:4,
      code:"FN01",
      name:"finanzas",

    }
  });

  await prisma.admissionTest_Career.create({
    data:{
      minScore:700,
      admissionTestId:1,
      careerId:4

    }
  });

  await prisma.inscription.create({
    data:{
      photoCertificate:"",
      personId:1,
      principalCareerId:1,
      secondaryCareerId:4
    }
  });


}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
