import fetch from 'node-fetch';
import axios from 'axios';
import fs from "fs";
import yts from 'yt-search';
import ytdl from 'ytdl-core';
import path from 'path';
import pkg from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { exec } = pkg;
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Definir __dirname manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let enviando = false;

const handler = async (m, { conn, args }) => {
  const datas = global;
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje;
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`));
  const tradutor = _translate.plugins.downloader_yta_2;
  const tradutorrr = _translate.plugins.downloader_yta;

  if (!args[0]) return await conn.sendMessage(m.chat, { text: tradutor.texto1 }, { quoted: m });

  if (enviando) return;
  enviando = true;

  const { key } = await conn.sendMessage(m.chat, { text: tradutor.texto2 }, { quoted: m });

  const youtubeLink = args[0];

  try {
    const yt_search = await yts(youtubeLink);
    const video = yt_search.all[0];
    const outputFilePath = path.join(__dirname, `temp/${video.videoId}.mp3`);

    await new Promise((resolve, reject) => {
      const stream = ytdl(video.url, { quality: 'highestaudio' });
      ffmpeg(stream)
        .audioBitrate(128)
        .save(outputFilePath)
        .on('end', resolve)
        .on('error', reject);
    });

    const buff_aud = fs.readFileSync(outputFilePath);
    const fileSizeInBytes = buff_aud.byteLength;
    const fileSizeInKB = fileSizeInBytes / 1024;
    const fileSizeInMB = fileSizeInKB / 1024;
    const size = fileSizeInMB.toFixed(2);
    const title = video.title;
    const cap = `${tradutor.texto3[0]} ${title}\n${tradutor.texto3[1]}  ${size} MB`.trim();
    await conn.sendMessage(m.chat, { document: buff_aud, caption: cap, mimetype: 'audio/mpeg', fileName: `${title}.mp3` }, { quoted: m });
    await conn.sendMessage(m.chat, { text: tradutorrr.texto5[4], edit: key }, { quoted: m });

    fs.unlinkSync(outputFilePath);
    enviando = false;
  } catch (error) {
    console.error(error);
    enviando = false;
    await conn.sendMessage(m.chat, { text: tradutor.texto4, edit: key }, { quoted: m });
  } finally {
    enviando = false;
  }
};


handler.command = /^(ytmp3doc|ytadoc|ytmp3.2|yta.2)$/i;
export default handler;