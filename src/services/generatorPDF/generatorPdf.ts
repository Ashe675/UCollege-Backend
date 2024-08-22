import { degrees, PDFDocument, PDFFont, PDFPage, rgb, RGB, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { toString } from 'pdfkit';
import { Student, User, Person, Career, Class, Enrollment } from '@prisma/client';
import { prisma } from '../../config/db';
import { userInfo } from 'os';
import { match } from 'assert';
import { promises } from 'dns';
import getBarCode from '../../utils/getBarCode';

const SELLO_CALIFICACIONES="assets/imagesSystem/selloCalificaciones.png"
const SELLO_DIRECCION="assets/imagesSystem/selloDireccion.png"

const FIRMA_DIRECCION = "assets/imagesSystem/FirmaDireccion.png"
const FIRMA_CALIFICACION = "assets/imagesSystem/FirmaCalificaciones.png"


const BLACK = rgb(0,0,0);
const RENGLON = 31.1

let yPositionCurrent = 780;
let yPositionSerial=832;
let yPositionRN = 840;
const xPosition = 50;

const pageHeightLimit = 50; // Define un límite para el fondo de la página

let currentPage: PDFPage
let pages : PDFPage[]=[];

function toUpperCase(text: string): string {
  return text.toUpperCase();
}


class PDFCertificate {
  private doc: PDFDocument;
  private docCopy :PDFDocument;

  private font: PDFFont;
  private fontBold : PDFFont;

  private infoUser: User;
  private infoPerson: Person;
  private infoCareer: Career;

  private pdfNew: string;

  private serialN: number =0;
  private RN: string ;

  constructor(user:User, person:Person, career: Career) {
    this.infoUser=user;
    this.infoPerson = person;
    this.infoCareer = career;
    

  }

  private async checkPageAndAddPage(): Promise<void> {
    if (yPositionCurrent < pageHeightLimit) {

        await this.addImage(SELLO_CALIFICACIONES, xPosition+240, yPositionCurrent+500, 0.2, 0.5, 15);
        // Copiar la primera página del documento original
        const [newPage] = await this.doc.copyPages(this.docCopy, [0]); // Copiar página de docCopy

        // Agregar la nueva página copiada al documento original
        this.doc.addPage(newPage);

        // Actualizar la lista de páginas y la página actual
        pages = this.doc.getPages();
        currentPage = pages[pages.length - 1];
        yPositionCurrent = currentPage.getHeight() - 222; // Ajustar según sea necesario
        
        this.serialN += 1;
        yPositionSerial = yPositionCurrent + 45
        this.addSerianNumber();

        yPositionRN = yPositionCurrent + 57
        this.addRN();
    }
  }

  async generate(enrollments: any[], pdfPath: string): Promise<Uint8Array> {
      // Cargar el PDF original desde la ruta especificada
      const existingPdfBytes = await fs.readFile(pdfPath);
      this.doc = await PDFDocument.load(existingPdfBytes);
      this.docCopy = await PDFDocument.load(existingPdfBytes); // Crear un documento para copiar páginas

      this.pdfNew = pdfPath;

      // Incrustar la fuente estándar Helvetica
      this.font = await this.doc.embedStandardFont(StandardFonts.Helvetica);
      this.fontBold = await this.doc.embedFont(StandardFonts.HelveticaBold);

      // Obtener la página inicial y asignarla como la página actual
      pages = this.doc.getPages();
      currentPage = pages[0];

      // Modificar el contenido del PDF basado en las inscripciones (enrollments)
      await this.addSerianNumber();
      await this.addRN();
      await this.addGradeBody(enrollments);
      await this.addTableGrade();

      await this.addLastText();
      await this.addFirmas();

      await this.addBarCode();
      await this.addPropietyText();

      yPositionCurrent=780;
      yPositionSerial = 836;
      yPositionRN = 840;
      // Guardar el documento PDF en un Uint8Array y retornarlo
      return await this.doc.save();
  }


    


  private async addSerianNumber(){
    await this.checkPageAndAddPage();
    let yPosition = yPositionSerial;
    if(this.serialN===0){
      this.serialN = this.generateSerialNumber()
    }
    this.writeText(`${this.serialN}`, 56, yPosition, currentPage, this.font, rgb(1,0,0));
  }

  private async addRN(){
    await this.checkPageAndAddPage();
    let yPosition = 838;
    
    this.RN = this.generateRN();
    this.writeText(this.RN, 485, yPositionRN,currentPage, this.font,BLACK ,10)
  }


  private async addGradeBody(enrollments: any[]) {
    await this.checkPageAndAddPage();
    pages = this.doc.getPages();

    const completeName = `${this.infoPerson.firstName} ${this.infoPerson.middleName || ''} ${this.infoPerson.lastName || ''} ${this.infoPerson.secondLastName || ''}`.trim();
    const completeNameCapitaize = toUpperCase(completeName);

    currentPage = pages[0];
    
    

    const text001 = `El Suscrito Director(a) de la direccion de ingreso Permanencia 
    y Promoción de la Universidad Nacional Autónoma de Honduras CERTIFICA QUE: 
    ${completeNameCapitaize} matriculado(a) con numero de cuenta ${this.infoUser.identificationCode}
    para la carrera de: ${toUpperCase(this.infoCareer.name)}, obtuvo las siguientes calificaciones:`;

    const cleanedText001 = text001.replace(/\s+/g, ' ').trim();
    
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);

    this.writeText(cleanedText001, xPosition, yPositionCurrent, currentPage);
    yPositionCurrent -= RENGLON;

    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);

    this.writeText(`CODIGO`, xPosition, yPositionCurrent, currentPage, this.fontBold);
    this.writeText(`ASIGNATURA`, xPosition + 80, yPositionCurrent, currentPage, this.fontBold);
    this.writeText(`CALIFICACION`, xPosition + 280, yPositionCurrent, currentPage, this.fontBold);
    this.writeText(`UV`, xPosition + 400, yPositionCurrent, currentPage, this.fontBold);
    
    yPositionCurrent -= RENGLON;
    let sumGrade: number=0;
    let sumUV: number=0;


    const enrollmentStudent = await prisma.enrollment.findMany({
      where:{student:{userId: this.infoUser.id}},
      include:{section:{
        include:{
          academicPeriod:{
            include:{
              process:true
            }
          },
          class:true
        }
      }}
    })

    let periodos : number[] =[];
    let years: number[] = [];
    enrollmentStudent.forEach(enrollmentStudent => {
      let year = enrollmentStudent.section.academicPeriod.process.startDate.getFullYear();
      let numberPeriodo = enrollmentStudent.section.academicPeriod.number
      if (!years.includes(year)) {
        years.push(year);
      }
      if(!periodos.includes(numberPeriodo)){
        periodos.push(numberPeriodo);
      }

    });

    console.log(years) 
    console.log(periodos)
    
    for (const year of years){
      this.writeText(`Año ${year}`, xPosition, yPositionCurrent, currentPage);
      yPositionCurrent -= RENGLON;
      // Verificar y agregar nueva página si es necesario
      await this.checkPageAndAddPage();
      let allEnrollments = enrollmentStudent.filter(enrollment=>{
        let processYear = enrollment.section.academicPeriod.process.startDate.getFullYear();
        return processYear == year;
      });
      console.log(allEnrollments)

      for(const periodo of periodos){
        this.writeText(`Periodo ${periodo}`, xPosition, yPositionCurrent, currentPage);
        yPositionCurrent -= RENGLON;
        // Verificar y agregar nueva página si es necesario
        await this.checkPageAndAddPage();

        let enrollmentPeriodo = allEnrollments.filter(enrollment=>{
          let numberPeriodo = enrollment.section.academicPeriod.number;
          return numberPeriodo == periodo;
        });
        for (const enrollment of enrollmentPeriodo) {
          const clase: Class = enrollment.section.class;
          const enrollmentT: Enrollment = enrollment;
      
          let code = `${enrollment.section.class.code}`;
          let asignatura = `${enrollment.section.class.name}`;
          // Escribir texto en la página actual
          this.writeText(code, xPosition, yPositionCurrent, currentPage); 
          this.writeText(asignatura, xPosition + 80, yPositionCurrent, currentPage); 
          this.writeText(`${enrollmentT.grade} *`, xPosition + 280, yPositionCurrent, currentPage);
          this.writeText(`${clase.UV} =`, xPosition + 400, yPositionCurrent, currentPage);
          this.writeText(`${clase.UV * enrollmentT.grade} `, xPosition + 450, yPositionCurrent, currentPage);
      
          sumGrade += enrollmentT.grade;
          sumUV += clase.UV;
          yPositionCurrent -= RENGLON;
      
          // Verificar y agregar nueva página si es necesario
          await this.checkPageAndAddPage();
      }
        
      }

    }

    yPositionCurrent+=RENGLON;
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`_____________`, xPosition-5 + 400, yPositionCurrent-5, currentPage);
    yPositionCurrent-=RENGLON;
    this.writeText(`${sumUV}`, xPosition + 400, yPositionCurrent, currentPage);
    this.writeText(`${sumGrade}`, xPosition + 450, yPositionCurrent, currentPage);
    yPositionCurrent-=RENGLON;
    this.writeText(`INDICE ACÁDEMICO:   (${sumGrade})  /  (${sumUV})  =  ${Math.round(sumGrade/sumUV)}%`, xPosition , yPositionCurrent, currentPage);


  }

  private async addTableGrade(){
    await this.checkPageAndAddPage();
    //const pages = this.doc.getPages();
    //let currentPage= pages[0]

    yPositionCurrent-=RENGLON*2;
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    
    let heightTable = yPositionCurrent-(yPositionCurrent-RENGLON);
    let yPositionTable = yPositionCurrent+RENGLON;
    this.writeText(`TABLA DE CALIFICACIONES`, xPosition, yPositionCurrent, currentPage, this.font);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`DE GRADO`, xPosition, yPositionCurrent, currentPage, this.fontBold);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`Calificación`, xPosition, yPositionCurrent, currentPage, this.font);
    this.writeText(`Vigente`, xPosition + 100, yPositionCurrent, currentPage, this.font);
    this.writeText(`Normas Acádemicas`, xPosition + 310, yPositionCurrent, currentPage, this.font);
    heightTable += RENGLON*2;
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`60%-100%`, xPosition, yPositionCurrent, currentPage, this.font);
    this.writeText(`Al II Periodo Acádemico 2015`, xPosition + 100, yPositionCurrent, currentPage, this.font);
    this.writeText(`Junio 1970`, xPosition + 310, yPositionCurrent, currentPage, this.font);
    heightTable += RENGLON;
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`65%-100%`, xPosition, yPositionCurrent, currentPage, this.font);
    this.writeText(`Deste el II Periodo Acádemico 2015`, xPosition + 100, yPositionCurrent, currentPage, this.font);
    this.writeText(`Enero 2015  Art. 315`, xPosition + 310, yPositionCurrent, currentPage, this.font);
    heightTable += RENGLON;
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);

    this.writeText(`MEDICINA, ENFERMERIA Y ARQUITECTURA`, xPosition, yPositionCurrent, currentPage, this.fontBold);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`Calificación`, xPosition, yPositionCurrent, currentPage, this.font);
    this.writeText(`Vigente`, xPosition + 100, yPositionCurrent, currentPage, this.font);
    this.writeText(`Normas Acádemicas`, xPosition + 310, yPositionCurrent, currentPage, this.font);
    heightTable += RENGLON*2;
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`60%-100%`, xPosition, yPositionCurrent, currentPage, this.font);
    this.writeText(`Al II Periodo Acádemico 2015`, xPosition + 100, yPositionCurrent, currentPage, this.font);
    this.writeText(`Enero 2015 Art.245`, xPosition + 310, yPositionCurrent, currentPage, this.font);
    heightTable += RENGLON;
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();

    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`65%-100%`, xPosition, yPositionCurrent, currentPage, this.font);
    this.writeText(`Deste el II Periodo Acádemico 2016`, xPosition + 100, yPositionCurrent, currentPage, this.font);
    this.writeText(`Enero 2015  Art.245`, xPosition + 310, yPositionCurrent, currentPage, this.font);
    heightTable += RENGLON;
    yPositionCurrent-=RENGLON;
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);

    this.writeText(`POSTGRADO`, xPosition, yPositionCurrent, currentPage, this.fontBold);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`Calificación`, xPosition, yPositionCurrent, currentPage, this.font);
    this.writeText(`Vigente`, xPosition + 100, yPositionCurrent, currentPage, this.font);
    this.writeText(`Normas Acádemicas`, xPosition + 310, yPositionCurrent, currentPage, this.font);
    heightTable += RENGLON*2;
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`70%-100%`, xPosition, yPositionCurrent, currentPage, this.font);
    this.writeText(`Reflejados en plan de estudios`, xPosition + 100, yPositionCurrent, currentPage, this.font);
    this.writeText(`Art. 52 reglamentos de postgrado`, xPosition + 310, yPositionCurrent, currentPage, this.font);
    heightTable += RENGLON;
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    // //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);
    this.writeText(`75%-100%`, xPosition, yPositionCurrent, currentPage, this.font);
    this.writeText(`A partir del 1 periodo del 2008`, xPosition + 100, yPositionCurrent, currentPage, this.font);
    this.writeText(`Art. 52 reglamentos de postgrado`, xPosition + 310, yPositionCurrent, currentPage, this.font);
    heightTable += RENGLON;
    yPositionCurrent-=RENGLON;
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    //yPositionCurrent = this.checkPageLimitAndAddPage(yPositionCurrent, currentPage, pages, pageHeightLimit);

    
    
    //this.drawRectangle(xPosition-10, yPositionTable-3, 520, heightTable, currentPage);
  }

  private drawRectangle(x: number, y: number, width: number, height: number, page: PDFPage, borderWidth: number = 1, borderColor = BLACK) {
    //REDIMENCIONA la haltura AL TAMANIO DE LA PAGINA
    //height=780-(780-yPositionCurrent);
    page.drawRectangle({
      x: x,
      y: y - height, // Ajustar la posición vertical para que el origen esté en la esquina superior izquierda
      width: width,
      height: height,
      borderWidth: borderWidth,
      borderColor: borderColor,
      //color: null,
    });
  }

  private async addLastText(){
    let text01=`INDICE ACÁDEMICO: Se obtiene la sumatoria de las calificaciones obtenidas, multiplicada por las`
    this.writeText(text01, xPosition , yPositionCurrent, currentPage, this.font);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    let text11=`unidades valorativas créditos dividido entre la totalidad de las unidades valorativas o créditos`;
    this.writeText(text11, xPosition , yPositionCurrent, currentPage, this.font);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    
    let text12=`acádemicos obtenidos. Segun las Normas Acádemicas de la UNAH de Enero 2015(Art. 188)`
    this.writeText(text12, xPosition , yPositionCurrent, currentPage, this.font);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();

    let text02=`U.V.: La Unidad Valorativa es la medida de la intencidad con que se imparte una asignatura`.replace(/\s+/g, ' ').trim()
    this.writeText(text02, xPosition , yPositionCurrent, currentPage, this.font);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();

    let text03=`Y para los fines que al interesado (a) convenga se le extiende la presente en Ciudad`.replace(/\s+/g, ' ').trim()
    this.writeText(text03, xPosition , yPositionCurrent, currentPage, this.font);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();

    let {dia, mes, anio} = this.obtenerFechaActual()
    
    let text04=`Universitaria a los ${dia} del mes ${mes} del año ${anio}`.replace(/\s+/g, ' ').trim()
    this.writeText(text04, xPosition , yPositionCurrent, currentPage, this.font);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
  }

  private async addFirmas(){
    yPositionCurrent-=RENGLON*3;
    await this.checkPageAndAddPage();
    this.writeText(`____________________________`, xPosition , yPositionCurrent+1, currentPage, this.font);
    await this.addImage(SELLO_CALIFICACIONES, xPosition+100, yPositionCurrent+100, 0.2, 0.5, 9);
    await this.addImage(FIRMA_CALIFICACION, xPosition+20, yPositionCurrent+70, 0.2, 0.8, -1);
    this.writeText(`____________________________`, xPosition+260 , yPositionCurrent+1, currentPage, this.font);
    await this.addImage(SELLO_DIRECCION, xPosition+351, yPositionCurrent+89, 0.2, 0.5, -10);
    await this.addImage(FIRMA_DIRECCION, xPosition+300, yPositionCurrent+50, 0.2, 0.8, 6);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();

    this.writeText(`Encargada de Calificaciones`, xPosition+15 , yPositionCurrent+1, currentPage, this.font);
    this.writeText(`a.i Director(a)`, xPosition+295 , yPositionCurrent+1, currentPage, this.font);

    yPositionCurrent-=RENGLON*4;
    await this.checkPageAndAddPage();
  }

  private async addPropietyText(){
    const completeName = `${this.infoPerson.firstName} ${this.infoPerson.middleName || ''} ${this.infoPerson.lastName || ''} ${this.infoPerson.secondLastName || ''}`.trim();
    const completeNameCapitaize = toUpperCase(completeName);


    this.writeText(`Este documento pertinece a ${completeNameCapitaize}, matriculado(a)`, xPosition , yPositionCurrent, currentPage, this.font);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
    
    this.writeText(`con el numero de cuenta ${this.infoUser.identificationCode}, en la carrera de`, xPosition , yPositionCurrent, currentPage, this.font);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();

    this.writeText(`${this.infoCareer.name}`, xPosition , yPositionCurrent, currentPage, this.font);
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();

    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();

    this.writeText(`Consta de ${pages.length} hojas selladas y firmadas en papel Sellado No. 1 hasta ${pages.length}`, xPosition , yPositionCurrent, currentPage, this.font);  
  }

  private async addBarCode(){
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();

    let barcodeImage = await getBarCode(this.RN);
    // Embed the barcode image in the PDF
    const barcodeImageBytes = await fetch(barcodeImage).then(res => res.arrayBuffer());
    const barcodeImageEmbed = await this.doc.embedPng(barcodeImageBytes);

    // Dibujar la imagen del código de barras en la página del PDF
    const { width, height } = barcodeImageEmbed.scale(0.5);
    currentPage.drawImage(barcodeImageEmbed, {
      x: 50,
      y: yPositionCurrent,
      width,
      height,
    });
    yPositionCurrent-=RENGLON;
    await this.checkPageAndAddPage();
  }

  private obtenerFechaActual(): { dia: number, mes: number, anio: number } {
    const fecha = new Date();
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1; // Los meses en JavaScript son 0-indexados
    const anio = fecha.getFullYear();

    return { dia, mes, anio };
  }


  // Método para escribir un texto en una posición específica
  private writeText(text: string, x: number, y: number, page: PDFPage, font=this.font ,color = rgb(0, 0, 0), size = 12, maxWidth = 530 ) {
    const lines = this.splitTextIntoLines(text, maxWidth, size);
    
    lines.forEach((line, index) => {
      page.drawText(line, {
        x: x,
        y: y - (index * (RENGLON)), // Ajusta el espacio entre líneas
        size: size,
        color: color,
        font: font
      });
    });
  }

  private splitTextIntoLines(text: string, maxWidth: number, size: number): string[] {
    const lines: string[] = [];
    let line = '';
    const words = text.split(' ');

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const  width  = this.font.widthOfTextAtSize(testLine, size);

      if (width > maxWidth) {
        lines.push(line);
        line = word;
        yPositionCurrent-=RENGLON;
        
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      lines.push(line);
    }

    return lines;
  }

  private async addImage(imagePath: string, x: number, y: number, scale: number, opacity: number=1, rotationDegrees:number=0) {
    const imageBytes = await fs.readFile(imagePath);
    const image = await this.doc.embedPng(imageBytes);

    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;

    currentPage.drawImage(image, {
      x: x,
      y: y - scaledHeight, // Ajuste de la coordenada Y para la altura de la imagen
      width: scaledWidth,
      height: scaledHeight,
      opacity: opacity,
      rotate: degrees(rotationDegrees)
    });

  }
  private checkPageLimitAndAddPage(yPosition: number, currentPage: PDFPage, pages: PDFPage[], limit: number = 5): number {
    if (yPosition < limit) {

        currentPage = this.doc.addPage();
        pages.push(currentPage);
        currentPage = pages[pages.length - 1]; // Obtener la última página añadida
        return currentPage.getHeight() - 50; // Ajustar según sea necesario
    }
    return yPosition;
  }


  private generateSerialNumber() {
    const min = 1000000; // Número mínimo de 7 dígitos
    const max = 9999999; // Número máximo de 7 dígitos
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private generateRN(){
    return `${this.generateSerialNumber()}/${this.infoPerson.lastName}`
  }

}

export default PDFCertificate;
