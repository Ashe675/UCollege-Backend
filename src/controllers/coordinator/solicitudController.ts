import { prisma } from "../../config/db"
import { Request,Response } from "express"

export const accetSolicitudCarrer = async (req:Request, res: Response)=>{
    const {id:userId} = req.user;
    let idSolicitud = parseInt(req.params.idSolicitud);

    try {
        //obtener solicitud
        const solicitud = await prisma.solicitud.findUnique({
            where:{id: idSolicitud},
            include:{
                career: true,
                enrollments: true,
                student:{include:{user:true}},
            },

        });

        //Buscar carrera
        const newCarrer = await prisma.career.findUnique({
            where:{id: solicitud.career.id},
        })

        //buscar RegionalCenter_Faculty_Career 

        //buscar la relacion usuario-facultad calrrera user a actualizar
        const regionalCenterFacultyCareerDepartmentUser = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where:{userId: solicitud.student.userId, },
            
        })
    } catch (error) {
        
    }
}