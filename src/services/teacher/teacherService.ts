import { prisma } from "../../config/db";


export const updateSection = async (sectionId: number, title: string | null, description: string | null) => {
    try {
        const updatedSection = await prisma.section.update({
            where: { id: sectionId },
            data: {
                title,
                description,
            },
        });

        return updatedSection;
    } catch (error) {
        throw new Error(`Error al actualizar la sección: ${error.message}`);
    }
};