import axios from 'axios';
import fs from 'fs';
import path from 'path';
import yts from 'yt-search';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import crypto from 'crypto';

ffmpeg.setFfmpegPath(ffmpegPath.path);

let limit1 = 100;
let limit2 = 400;
let limit_a1 = 50;
let limit_a2 = 400;

const requestQueue = [];
let isProcessing = false;

const handler = async (m, { conn, command, args, text, usedPrefix }) => {
  try {
    if (!text) {
      throw `🎵 **Descargas - Play**\n\nPor favor, proporciona el título de la canción o video de YouTube.\n\n💡 *Ejemplo:* _${usedPrefix + command} Good Feeling - Flo Rida_`;
    }

    const yt_play = await search(args.join(' '));
    if (!yt_play || !yt_play[0]?.title) {
      return m.reply('> ❌ Error: No se encontró el audio o video buscado.');
    }

    if (yt_play[0].duration.seconds > 1800) {
      await conn.sendMessage(m.chat, {
        text: '> ❌ No se puede procesar la solicitud porque la duración del video excede los 30 minutos.'
      }, { quoted: m });
      return;
    }

    if (isProcessing) {
      await conn.sendMessage(m.chat, { 
        text: '> ⏳ Tu solicitud está en cola. Será procesada en breve.'
      }, { quoted: m });
    } else {
      const texto1 = `🎵 Título: ${yt_play[0].title}\n📆 Publicado: ${yt_play[0].ago}\n⏱ Duración: ${secondString(yt_play[0].duration.seconds)}\n👤 Autor: ${yt_play[0].author.name}\n\n> ⏳ Enviando, por favor espera...`.trim();

      await conn.sendMessage(m.chat, { image: { url: yt_play[0].thumbnail }, caption: texto1 }, { quoted: m });
    }

    requestQueue.push({ m, conn, command, yt_play, retryCount: 0 });
    processQueue();
  } catch (error) {
    console.error('Handler Error:', error);
    if (typeof error === 'string') {
      m.reply(error);
    } else {
      m.reply('> ❌ Ocurrió un error al procesar tu solicitud. \n> Por favor, inténtalo de nuevo más tarde.');
    }
  }
};

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  while (requestQueue.length > 0) {
    const { m, conn, command, yt_play, retryCount } = requestQueue.shift();

    if (['play', 'play3', 'playdoc'].includes(command)) {
      await handleAudio(m, conn, command, yt_play, retryCount);
    }

    if (['play2', 'play4', 'playdoc2'].includes(command)) {
      await handleVideo(m, conn, command, yt_play, retryCount);
    }
  }

  isProcessing = false;
}

async function handleAudio(m, conn, command, yt_play, retryCount) {
  try {
    const response = await axios.get(`https://api-ytdl-snzxvss-a837a3eabd4d.herokuapp.com/download/audio`, {
      params: {
        url: yt_play[0].url
      },
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const buff_aud = response.data;
    const size = (buff_aud.byteLength / (1024 * 1024)).toFixed(2);

    if (size >= limit_a2) {
      await conn.sendMessage(m.chat, { text: `🎶 El audio es demasiado grande para enviarlo. Por favor, descárgalo desde: _${yt_play[0].url}_` }, { quoted: m });
      return;
    }

    if (size >= limit_a1 && size <= limit_a2) {
      await conn.sendMessage(m.chat, {
        document: buff_aud,
        mimetype: 'audio/mpeg',
        fileName: `${sanitizeFileName(yt_play[0].title)}.mp3`
      }, { quoted: m });
    } else {
      if (['playdoc', 'play3'].includes(command)) {
        await conn.sendMessage(m.chat, {
          document: buff_aud,
          mimetype: 'audio/mpeg',
          fileName: `${sanitizeFileName(yt_play[0].title)}.mp3`
        }, { quoted: m });
      } else {
        await conn.sendMessage(m.chat, {
          audio: buff_aud,
          mimetype: 'audio/mpeg',
          fileName: `${sanitizeFileName(yt_play[0].title)}.mp3`
        }, { quoted: m });
      }
    }
  } catch (error) {
    handleAxiosError(error, conn, m, { command, yt_play, retryCount });
  }
}

async function handleVideo(m, conn, command, yt_play, retryCount) {
  let success = false;
  let buff_vid;

  while (!success) {
    try {
      const response = await axios.get(`https://api-ytdl-snzxvss-a837a3eabd4d.herokuapp.com/download/video`, {
        params: {
          url: yt_play[0].url,
          quality: '360p'
        },
        responseType: 'arraybuffer',
        timeout: 30000
      });
      buff_vid = response.data;
      success = true;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.warn('Axios timeout. Reintentando...');
        await conn.sendMessage(m.chat, { text: '❌ La solicitud ha excedido el tiempo de espera. Reintentando...' }, { quoted: m });

        await new Promise(resolve => setTimeout(resolve, 5000));
      } else if (error.response && [500, 502, 503].includes(error.response.status)) {
        console.warn(`Error ${error.response.status}. Reintentando...`);
        await conn.sendMessage(m.chat, { text: 'El servidor está ocupado. Tu petición está en cola. Por favor espera...' }, { quoted: m });

        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error('Error fetching video:', error);
        await conn.sendMessage(m.chat, { text: '> ❌ Ocurrió un error al procesar tu solicitud. \n> Por favor, inténtalo de nuevo más tarde.' }, { quoted: m });
        return;
      }
    }
  }

  try {
    const size2 = (buff_vid.byteLength / (1024 * 1024)).toFixed(2);

    if (size2 >= limit2) {
      await conn.sendMessage(m.chat, { text: `🎥 El vídeo es demasiado grande para enviarlo. Por favor, descárgalo desde: _${yt_play[0].url}_` }, { quoted: m });
      return;
    }

    const uniqueId = crypto.randomBytes(6).toString('hex');

    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const originalFileName = `${sanitizeFileName(yt_play[0].title)}_${uniqueId}.mp4`;
    const originalFilePath = path.join(tempDir, originalFileName);
    fs.writeFileSync(originalFilePath, buff_vid);

    const processedFileName = `${sanitizeFileName(yt_play[0].title)}_processed_${uniqueId}.mp4`;
    const processedFilePath = path.join(tempDir, processedFileName);

    await new Promise((resolve, reject) => {
      ffmpeg(originalFilePath)
        .videoCodec('libx264')
        .format('mp4')
        .outputOptions('-movflags frag_keyframe+empty_moov')
        .save(processedFilePath)
        .on('end', resolve)
        .on('error', reject);
    });

    const fileBuffer = fs.readFileSync(processedFilePath);

    if (size2 >= limit1 && size2 <= limit2) {
      await conn.sendMessage(m.chat, {
        document: fileBuffer,
        mimetype: 'video/mp4',
        fileName: processedFileName,
        caption: `🎥 Aquí está el video`
      }, { quoted: m });
    } else {
      if (['playdoc2', 'play4'].includes(command)) {
        await conn.sendMessage(m.chat, {
          document: fileBuffer,
          mimetype: 'video/mp4',
          fileName: processedFileName,
          caption: `🎥 Aquí está el video`
        }, { quoted: m });
      } else {
        await conn.sendMessage(m.chat, {
          video: fileBuffer,
          mimetype: 'video/mp4',
          fileName: processedFileName,
          caption: `🎥 Aquí está el video`
        }, { quoted: m });
      }
    }

    fs.unlinkSync(originalFilePath);
    fs.unlinkSync(processedFilePath);
  } catch (error) {
    console.error('Error processing video:', error);
    const tempDir = path.join(process.cwd(), 'temp');
    if (fs.existsSync(tempDir)) {
      fs.readdirSync(tempDir).forEach(file => {
        if (file.includes(crypto.randomBytes(6).toString('hex'))) {
          fs.unlinkSync(path.join(tempDir, file));
        }
      });
    }

    if (retryCount < 3) {
      console.warn('Retrying video processing...');
      requestQueue.push({ m, conn, command, yt_play, retryCount: retryCount + 1 });
      processQueue();
    } else {
      await conn.sendMessage(m.chat, { text: '> ❌ Ocurrió un error al procesar tu solicitud. \n> Por favor, inténtalo de nuevo más tarde.' }, { quoted: m });
    }
  }
}

handler.command = /^(play|play2|play3|play4|playdoc|playdoc2)$/i;
export default handler;

async function search(query, options = {}) {
  try {
    const search = await yts.search({ query, hl: 'es', gl: 'ES', ...options });
    return search.videos;
  } catch (error) {
    console.error('Search Error:', error);
    return null;
  }
}

function secondString(seconds) {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const dDisplay = d > 0 ? d + 'd ' : '';
  const hDisplay = h > 0 ? h + 'h ' : '';
  const mDisplay = m > 0 ? m + 'm ' : '';
  const sDisplay = s > 0 ? s + 's' : '';
  return dDisplay + hDisplay + mDisplay + sDisplay;
}

async function handleAxiosError(error, conn, m, { command, yt_play, retryCount }) {
  if (error.code === 'ECONNABORTED') {
    console.warn('Axios timeout. Enviando mensaje de timeout.');
    await conn.sendMessage(m.chat, { text: '❌ La solicitud ha excedido el tiempo de espera. Por favor, inténtalo de nuevo.' }, { quoted: m });
  } else if (error.response && [500, 502, 503].includes(error.response.status)) {
    console.warn(`Error ${error.response.status}. Enviando mensaje de servidor ocupado.`);
    await conn.sendMessage(m.chat, { text: '⚠️ El servidor está ocupado. \n> Por favor, inténtalo de nuevo más tarde. 🔄' }, { quoted: m });
  } else {
    console.error('Axios Error:', error);
    await conn.sendMessage(m.chat, { text: '> ❌ Ocurrió un error al procesar tu solicitud. \n> Por favor, inténtalo de nuevo más tarde.' }, { quoted: m });
  }

  if (retryCount < 3) {
    console.warn('Reintentando la solicitud...');
    requestQueue.push({ m, conn, command, yt_play, retryCount: retryCount + 1 });
    processQueue();
  }
}

function sanitizeFileName(name) {
  return name.replace(/[^a-z0-9_\-\.]/gi, '_');
}