import { prisma } from "../../config/db";
import { insertRandomDots, makeUserMethodSingle, shuffleArray } from "../../utils/enroll/generateRandomEmail";

export class EnrollService {
    static async enrollStudentCareer(optionId: number, userId: number) {
        const option = await prisma.optionCareer.findUnique({ where: { id: optionId, userId } })
        if (!option) {
            throw new Error(`La opción es inválida`)
        }

        const enroll = await prisma.regionalCenter_Faculty_Career_User.findFirst({
            where: {
                userId,
                regionalCenter_Faculty_CareerId: option.regionalCenter_Faculty_CareerId
            }
        })

        if (enroll) {
            throw new Error(`Ya está matriculado en la carrera`)
        }

        await prisma.regionalCenter_Faculty_Career_User.create({
            data: {
                regionalCenter_Faculty_CareerId: option.regionalCenter_Faculty_CareerId,
                userId
            }
        })

        await prisma.optionCareer.deleteMany({ where: { userId } })

        await prisma.user.update({ where: { id: userId }, data: { verified: true } })

    }


    /**
     * Generates a unique username based on provided names.
     * 
     * @param {string} firstName - The first name of the user.
     * @param {string | null} middleName - The middle name of the user.
     * @param {string} lastName - The last name of the user.
     * @param {string | null} secondLastName - The second last name of the user.
     * @param {string} domain - The domain to append to the username.
     * @returns {Promise<string>} - A unique username.
     */
    static async generateUniqueUsername(
        firstName: string,
        middleName: string | null,
        lastName: string,
        secondLastName: string | null,
        domain: string = '@unah.hn'
    ): Promise<string> {
        const nameParts = [firstName, middleName, lastName, secondLastName].filter(Boolean);
        let username = '';
        let attemps = 0;

        while (true) {
            attemps++
            const randomParts = shuffleArray(nameParts).slice(0, Math.floor(Math.random() * nameParts.length) + 1);

            if(attemps > 45){
                username = randomParts.join('').replace(/ /g, '');
                username = insertRandomDots(username);
            }else{
                // Insert dots optionally
                username = makeUserMethodSingle(randomParts);
            }
            

            // Check if the username already exists
            const userExists = await prisma.user.findUnique({ where: { institutionalEmail : username + domain } });

            if (!userExists) {
                break;
            }
        }

        return username.toLowerCase() + domain;
    }

}