import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Definir __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const handler = async (m, { conn, text, usedPrefix, command, isOwner }) => {
  const datas = global;
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje;
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`));
  const tradutor = _translate.plugins.herramientas_topdf;

  const q = m.quoted ? m.quoted : m;
  const mime = (q.msg || q).mimetype || '';
  if (!mime) throw tradutor.texto1;
  const img = await q.download?.();
  if (!img) throw tradutor.texto2;

  // Guardar la imagen en un directorio temporal
  const imgType = mime.split('/')[1];
  const imgPath = path.join(__dirname, 'temp', `temp_image.${imgType}`);
  fs.writeFileSync(imgPath, img);

  // Crear un nuevo documento PDF
  const pdfDoc = await PDFDocument.create();

  // Embed the image bytes and add it to the PDF
  let imgEmbed;
  if (imgType === 'jpeg' || imgType === 'jpg') {
    imgEmbed = await pdfDoc.embedJpg(img);
  } else if (imgType === 'png') {
    imgEmbed = await pdfDoc.embedPng(img);
  } else {
    throw tradutor.texto3; // Tipo de imagen no soportado
  }

  const { width, height } = imgEmbed.scale(1);

  // Crear una página con el mismo tamaño que la imagen
  const page = pdfDoc.addPage([width, height]);

  page.drawImage(imgEmbed, {
    x: 0,
    y: 0,
    width,
    height,
  });

  // Guardar el PDF en un buffer
  const pdfBytes = await pdfDoc.save();

  const docname = text ? text : m.pushName || 'documento';
  const pdfPath = path.join(__dirname, 'temp', `${docname}.pdf`);

  // Guardar el PDF en el sistema de archivos
  fs.writeFileSync(pdfPath, pdfBytes);

  // Enviar el archivo PDF
  await conn.sendFile(m.chat, pdfPath, `${docname}.pdf`, '', m, false, { asDocument: true });

  // Eliminar el archivo PDF y la imagen del sistema de archivos
  fs.unlinkSync(pdfPath);
  fs.unlinkSync(imgPath);
};

handler.command = /^topdf$/i;
export default handler;