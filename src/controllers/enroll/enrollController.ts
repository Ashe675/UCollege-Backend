import { Request, Response } from "express"
import { EnrollService } from "../../services/enroll/enrollService"

export class EnrollController {
    static async selectCareer (req : Request, res:Response) {
        const optionId : number = +req.body.optionId
        try {
            await EnrollService.enrollStudentCareer(optionId, req.user.id)

            res.send('¡Carrera Seleccionada Exitosamente!')
        } catch (error) {
            res.status(400).json({ error: error.message })
        }
    }
}