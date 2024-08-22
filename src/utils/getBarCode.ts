import { PDFDocument, rgb } from 'pdf-lib';
import JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';

export default async function getBarCode(numberRN:string) {
  // Crear un nuevo documento PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);

  // Crear un canvas para generar el código de barras
  const canvas = createCanvas(200,100);
  JsBarcode(canvas, numberRN, { format: 'CODE128' });

  // Convertir el canvas a una imagen
  const barcodeImage = canvas.toDataURL('image/png');
  return barcodeImage;

  // Embed the barcode image in the PDF
  const barcodeImageBytes = await fetch(barcodeImage).then(res => res.arrayBuffer());
  const barcodeImageEmbed = await pdfDoc.embedPng(barcodeImageBytes);

  // Dibujar la imagen del código de barras en la página del PDF
  const { width, height } = barcodeImageEmbed.scale(1);
  page.drawImage(barcodeImageEmbed, {
    x: 50,
    y: 300,
    width,
    height,
  });

  // Guardar el PDF
  const pdfBytes = await pdfDoc.save();
  // Puedes guardar o enviar el PDF generado
}


