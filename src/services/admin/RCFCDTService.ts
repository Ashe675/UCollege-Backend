import { prisma } from "../../config/db";

export const createRCFCDTService = async (teacherData: number, RegionalCenter_Faculty_Career_id: number, departamentId: number) => {
    
        const RCFCDT = await prisma.regionalCenter_Faculty_Career_Department_Teacher.create({
            data: {
                teacherId: teacherData,
                regionalCenter_Faculty_Career_Department_Departament_id: departamentId,
                RegionalCenter_Faculty_Career_id: RegionalCenter_Faculty_Career_id
            }
        });
        return RCFCDT;
    
};
