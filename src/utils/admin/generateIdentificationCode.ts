import { prisma } from "../../config/db";

/**
 * Genera un código de identificación único y secuencial para un empleado.
 * 
 * @returns {Promise<string>} - Un código de identificación único de 15 caracteres.
 */
export async function generateIdentificationCodeEmployee(): Promise<string> {
    // Contar el número actual de empleados
    let newEmployeeNumber = await prisma.user.count() + 1;
    let identificationCode = '';

    while (true) {
        // Convertir el número a una cadena y rellenarlo con ceros a la izquierda
        identificationCode = newEmployeeNumber.toString().padStart(15, '0');

        // Verificar si el código de identificación ya existe en la base de datos
        const codeExists = await prisma.user.findUnique({ where: { identificationCode } });

        if (!codeExists) {
            break;
        }

        // Incrementar el número para generar un nuevo código
        newEmployeeNumber++;
    }

    return identificationCode;
}


