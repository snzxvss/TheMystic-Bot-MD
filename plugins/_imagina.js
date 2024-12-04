import https from 'https';

// Función para limpiar archivos temporales no usados (no se utiliza en esta implementación)
const clearTmp = () => {
  console.log('🖼️ IMAGINA - Limpieza de archivos temporales no implementada.');
};

// Handler principal
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

      console.log(`🖼️ IMAGINA - Descargando imagen desde URL: ${imageUrl}`);

      // Opciones para deshabilitar la verificación de certificados
      const requestOptions = {
        rejectUnauthorized: false // ⚠️ Deshabilita la verificación SSL (no recomendado para producción)
      };

      // Descargar la imagen y almacenarla en un buffer
      const imageBuffer = await new Promise((resolve, reject) => {
        https.get(imageUrl, requestOptions, (imageRes) => {
          if (imageRes.statusCode !== 200) {
            console.error(`🖼️ IMAGINA - Error al descargar la imagen: Status Code ${imageRes.statusCode}`);
            reject('🖼️ IMAGINA - GENERAR IMAGEN\n\n⚠️ Error al descargar la imagen.');
            return;
          }

          const chunks = [];
          imageRes.on('data', (chunk) => {
            chunks.push(chunk);
          });
          imageRes.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log('🖼️ IMAGINA - Imagen descargada exitosamente en memoria.');
            resolve(buffer);
          });
        }).on('error', (err) => {
          console.error('🖼️ IMAGINA - Error al descargar la imagen:', err);
          reject('🖼️ IMAGINA - GENERAR IMAGEN\n\n⚠️ Error al descargar la imagen.');
        });
      });

      // Enviar la imagen al usuario desde el buffer
      console.log('🖼️ IMAGINA - Enviando imagen al usuario.');
      await conn.sendFile(m.chat, imageBuffer, 'imagen.png', '🎨 Aquí tienes tu imagen.', m);

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