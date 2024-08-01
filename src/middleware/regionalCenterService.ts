
import { prisma } from "../config/db";



export const getAllRegionalCentersWithDepartments = async () => {
    /**
     * 
    let departaments = await prisma.departament.findMany({
        include:{
            regionalCenterFacultyCareer:{
                include:{
                    RegionalCenterFacultyCareer:{
                        include: {
                            regionalCenter_Faculty:{
                                include:{
                                    regionalCenter:true
                                }
                            }
                        }
                    }
                }
            }
            
        }
    })
    */

    let departaments = await prisma.regionalCenter.findMany({
        include:{
            regionalCenter_Faculties:{
                include:{
                    regionalCenter_Faculty_Careers:{
                        include:{
                            departments:{
                                include:{
                                    Departament:true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    //return transformData(departaments);
    //return organizeRegionalCentersWithDepartments(departaments)
    return transformData2(departaments);
    
};

function transformData2(data) {
    return data.map(center => ({
      id: center.id,
      name: center.name,
      code: center.code,
      departamentos: center.regionalCenter_Faculties.flatMap(faculty =>
        faculty.regionalCenter_Faculty_Careers.flatMap(career =>
          career.departments.map(department => ({
            departmentId: department.departmentId,
            regionalCenter_Faculty_CareerId: department.regionalCenter_Faculty_CareerId,
            Departament: {
              id: department.Departament.id,
              name: department.Departament.name
            }
          }))
        )
      )
    }));
  }

interface Department {
    id: number;
    name: string;
    createdAt: Date; // Cambiado a Date
    active: boolean;
    careerId: number;
    regionalCenterFacultyCareer: RegionalCenterFacultyCareer[];
}

interface RegionalCenter {
    id: number;
    name: string;
    date: Date; // Cambiado a Date
    code: string;
    finalDate: Date | null; // Cambiado a Date | null
    townId: number;
}

interface Faculty {
    facultyId: number;
    regionalCenterId: number;
    startDate: Date; // Cambiado a Date
    finalDate: Date | null; // Cambiado a Date | null
    active: boolean;
    regionalCenter: RegionalCenter;
}

interface RegionalCenterFaculty {
    facultyId: number;
    regionalCenterId: number;
    startDate: Date; // Cambiado a Date
    finalDate: Date | null; // Cambiado a Date | null
    active: boolean;
    regionalCenter: RegionalCenter;
}

interface RegionalCenterFacultyCareer {
    departmentId: number;
    regionalCenter_Faculty_CareerId: number;
    active: boolean;
    RegionalCenterFacultyCareer: {
        id: number;
        regionalCenter_Faculty_FacultyId: number;
        regionalCenter_Faculty_RegionalCenterId: number;
        careerId: number;
        startDate: Date; // Cambiado a Date
        finalDate: Date | null; // Cambiado a Date | null
        active: boolean;
        regionalCenter_Faculty: Faculty;
    }
}

interface CenterDepartments {
    name: string;
    date: Date; // Cambiado a Date
    code: string;
    departments: {
        [key: number]: {
            id: number;
            name: string;
            createdAt: Date; // Cambiado a Date
            active: boolean;
            regionalCenterFacultyCareer: RegionalCenterFacultyCareer[];
        }
    }
}

function transformData(departments: Department[]): { [key: number]: CenterDepartments } {
    const result: { [key: number]: CenterDepartments } = {};

    departments.forEach(department => {
        department.regionalCenterFacultyCareer.forEach(rcc => {
            const regionalCenterId = rcc.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenterId;
            const regionalCenter = rcc.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenter;

            if (!result[regionalCenterId]) {
                result[regionalCenterId] = {
                    name: regionalCenter.name,
                    date: regionalCenter.date,
                    code: regionalCenter.code,
                    departments: {}
                };
            }

            const departmentId = department.id;

            if (!result[regionalCenterId].departments[departmentId]) {
                result[regionalCenterId].departments[departmentId] = {
                    id: departmentId,
                    name: department.name,
                    createdAt: department.createdAt,
                    active: department.active,
                    regionalCenterFacultyCareer: []
                };
            }

            // Agregar el RegionalCenterFacultyCareer al departamento
            result[regionalCenterId].departments[departmentId].regionalCenterFacultyCareer.push(rcc);
        });
    });

    return result;
};



const organizeRegionalCentersWithDepartments = (data) => {
    const result = [];

    // Mapa para agrupar centros regionales por su id
    const regionalCentersMap = new Map();

    // Mapa para almacenar los departamentos por id
    const departmentsMap = new Map();

    // Mapa para almacenar los IDs de RegionalCenterFacultyCareer
    const regionalCenterFacultyCareerMap = new Map();

    // Primero, recopilamos todos los departamentos y los IDs de RegionalCenterFacultyCareer
    data.forEach(career => {
        career.regionalCenterFacultyCareer.forEach(rcfc => {
            const departmentId = rcfc.departmentId;
            const departmentName = career.name; // Asumo que 'career.name' es el nombre del departamento

            // Almacena el nombre del departamento por su ID
            if (!departmentsMap.has(departmentId)) {
                departmentsMap.set(departmentId, departmentName);
            }

            // Almacena el ID de RegionalCenterFacultyCareer para cada departamento
            const regionalCenterId = rcfc.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenter.id;
            if (!regionalCenterFacultyCareerMap.has(regionalCenterId)) {
                regionalCenterFacultyCareerMap.set(regionalCenterId, new Set());
            }
            regionalCenterFacultyCareerMap.get(regionalCenterId).add(rcfc.regionalCenter_Faculty_CareerId);
        });
    });

    // Luego, agrupamos los centros regionales y sus departamentos
    data.forEach(career => {
        career.regionalCenterFacultyCareer.forEach(rcfc => {
            const regionalCenter = rcfc.RegionalCenterFacultyCareer.regionalCenter_Faculty.regionalCenter;

            if (!regionalCentersMap.has(regionalCenter.id)) {
                regionalCentersMap.set(regionalCenter.id, {
                    regionalCenter: regionalCenter.name,
                    code: regionalCenter.code,
                    centerId: regionalCenter.id,
                    departments: new Set(),
                    facultyCareerIds: new Set()
                });
            }

            // Agregar el departamento al centro regional
            const regionalCenterData = regionalCentersMap.get(regionalCenter.id);
            regionalCenterData.departments.add(rcfc.departmentId);
            regionalCenterData.facultyCareerIds.add(rcfc.regionalCenter_Faculty_CareerId);
        });
    });

    // Convertir el mapa a la estructura deseada
    regionalCentersMap.forEach(value => {
        result.push({
            regionalCenter: value.regionalCenter,
            code: value.code,
            centerId: value.centerId,
            departments: Array.from(value.departments).map(id => ({
                id: id,
                name: departmentsMap.get(id)
            })),
            facultyCareerIds: Array.from(value.facultyCareerIds)
        });
    });

    return result;
};
