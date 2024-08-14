import { Request, Response } from "express"
import { prisma } from "../../config/db";

//Librerias para pdf y excel
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

/* 
export const exportExcel = async (req: Request, res: Response)=>{
    const sections = await prisma.section.findMany();
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sections);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sections');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=sections.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
}
*/