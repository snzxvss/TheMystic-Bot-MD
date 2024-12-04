import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Definir el directorio temporal dentro de la carpeta del plugin
const tempDir = path.join(__dirname, 'temp');

console.log(`🖼️ IMAGINA - Inicializando directorio temporal en: ${tempDir}`);

// Asegurar que el directorio temporal exista
try {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log('🖼️ IMAGINA - Directorio temporal creado exitosamente.');
  } else {
    console.log('🖼️ IMAGINA - Directorio temporal ya existe.');
  }
} catch (mkdirErr) {
  console.error('🖼️ IMAGINA - Error al crear el directorio temporal:', mkdirErr);
  // Opcional: Terminar la ejecución si no se puede crear el directorio temporal
  process.exit(1);
}

// Función para limpiar archivos temporales no enviados
const clearTmp = () => {
  console.log('🖼️ IMAGINA - Iniciando limpieza de archivos temporales...');
  fs.readdir(tempDir, (err, files) => {
    if (err) {
      console.error('🖼️ IMAGINA - LIMPIEZA TEMPORAL\n\n⚠️ No se pudo leer el directorio temporal:', err);
      return;
    }
    if (files.length === 0) {
      console.log('🖼️ IMAGINA - No hay archivos temporales para eliminar.');
      return;
    }
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.unlink(filePath, err => {
        if (err) {
          console.error('🖼️ IMAGINA - LIMPIEZA TEMPORAL\n\n⚠️ No se pudo eliminar el archivo temporal:', err);
        } else {
          console.log(`🖼️ IMAGINA - Archivo temporal eliminado: ${filePath}`);
        }
      });
    });
  });
};

// Opcional: Limpiar archivos temporales al iniciar
clearTmp();

const handler = async (m, { conn, command, args, text, usedPrefix }) => {
  if (['imagine', 'imag', 'gen'].includes(command)) {
    if (!text) {
      throw `🖼️ IMAGINA - GENERAR IMAGEN

ℹ️ Necesitas proporcionar el texto para generar la imagen.

💡 Ejemplo:
_${usedPrefix + command} Playa al atardecer_`;
    }

    // Enviar mensaje de procesamiento
    await conn.reply(m.chat, '> 📥 Procesando tu solicitud, por favor espera...', m);

    try {
      const apiToken = 'eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoidXNlciIsInByb3BlcnRpZXMiOnsidXNlcklkIjoiOWFmM2MzNDEtZGFkNC00MmEyLWE1YmEtMTJlMGExOWEzNDM5In0sImlhdCI6MTczMzI3NjI5MSwiZXhwIjoxNzU5MTk2MjkxfQ.aj7tyrFl9hlbapkrodVqQVLqh0LdGuXV8OW3wd14TvDdMENAjSOkqMiB7-k4_RlqFWC_wgVchhmsuxd0Y2MFS85pKDlhN_IGE30cQx7KRx7BroM3hu6H8dFvLmBcaM5ZqGsDVKX-g7HmwG2-BQ3-i4eIYjJ6uldzRF6ZuhSPBZXDdK2fqdku2VSxj4r9q0jE8WMwqQ5fZUxBeI4C61KqOO95xjkwJrl6Eft6Jons7A-kh_XA-kLTImVLMRkL7U0GdG5eLY6CiQDvPudyfQdMJhLHMWwxTYcmquBE_ElYdlA0VzLFjmLECMh5-fnpgI-9Q0hJ_cSRpqTQpJN_V_ANbg';

      const postData = JSON.stringify({ message: text });

      const options = {
        hostname: 'api.jadve.com',
        path: '/openai/generate-image',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': `Bearer ${apiToken}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      console.log('🖼️ IMAGINA - Enviando solicitud al API para generar imagen.');

      const imageUrl = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = '';

          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log(`🖼️ IMAGINA - Respuesta del API con status code: ${res.statusCode}`);
            if (res.statusCode === 200) {
              try {
                const responseData = JSON.parse(data);
                const url = responseData.data.message[0].url;
                console.log('🖼️ IMAGINA - URL de la imagen generada:', url);
                resolve(url);
              } catch (err) {
                console.error('🖼️ IMAGINA - Error al parsear la respuesta del API:', err);
                reject('🖼️ IMAGINA - GENERAR IMAGEN\n\n⚠️ Error al analizar la respuesta del API.');
              }
            } else {
              console.error(`🖼️ IMAGINA - Error en la solicitud al API: Status Code ${res.statusCode}`);
              reject(`🖼️ IMAGINA - GENERAR IMAGEN\n\n⚠️ Error en la solicitud: ${res.statusCode}`);
            }
          });
        });

        req.on('error', (err) => {
          console.error('🖼️ IMAGINA - Error en la solicitud al API:', err);
          reject('🖼️ IMAGINA - GENERAR IMAGEN\n\n⚠️ Error al generar la imagen.');
        });
        req.write(postData);
        req.end();
      });

      // Generar nombre de archivo único
      const fileName = `${uuidv4()}_imagen.jpg`;
      const filePath = path.join(tempDir, fileName);
      console.log(`🖼️ IMAGINA - Descargando imagen desde URL: ${imageUrl}`);

      // Descargar la imagen y guardarla en el directorio temporal
      await new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(imageUrl, (imageRes) => {
          if (imageRes.statusCode !== 200) {
            console.error(`🖼️ IMAGINA - Error al descargar la imagen: Status Code ${imageRes.statusCode}`);
            reject('🖼️ IMAGINA - GENERAR IMAGEN\n\n⚠️ Error al descargar la imagen.');
            return;
          }

          imageRes.pipe(file);
          file.on('finish', () => {
            file.close(() => {
              console.log(`🖼️ IMAGINA - Imagen descargada y guardada en: ${filePath}`);
              resolve();
            });
          });
        }).on('error', (err) => {
          fs.unlink(filePath, () => {}); // Eliminar archivo parcial
          console.error('🖼️ IMAGINA - Error al descargar la imagen:', err);
          reject('🖼️ IMAGINA - GENERAR IMAGEN\n\n⚠️ Error al descargar la imagen.');
        });
      });

      // Enviar la imagen al usuario
      console.log('🖼️ IMAGINA - Enviando imagen al usuario.');
      await conn.sendFile(m.chat, filePath, 'imagen.jpg', '🎨 Aquí tienes tu imagen.', m);

      // Eliminar el archivo temporal después de enviarlo
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error('🖼️ IMAGINA - Error al eliminar la imagen temporal:', err);
        } else {
          console.log(`🖼️ IMAGINA - Archivo temporal eliminado: ${filePath}`);
        }
      });

    } catch (error) {
      console.error('🖼️ IMAGINA - Error en el proceso:', error);
      await conn.reply(m.chat, `🖼️ IMAGINA - GENERAR IMAGEN\n\n⚠️ Ocurrió un error. Por favor, inténtalo de nuevo más tarde.`, m);
    }
  }
};

handler.help = ['gen', 'imagina', 'imag'];
handler.tags = ['image'];
handler.command = /^(gen|imagina|imag)$/i;

export default handler;