import { prisma } from "../../config/db";

export const createRCFCDTService = async (teacherData: number, RegionalCenter_Faculty_Career_id: number, departamentId: number, roleId : number) => {
    
        const RCFCDT = await prisma.regionalCenter_Faculty_Career_Department_Teacher.create({
            data: {
                teacherId: teacherData,
                regionalCenter_Faculty_Career_Department_Departament_id: departamentId,
                regionalCenter_Faculty_Career_Department_RegionalCenter_Faculty_Career_id: RegionalCenter_Faculty_Career_id,
                roleId
            }
        });
        return RCFCDT;
    
};
