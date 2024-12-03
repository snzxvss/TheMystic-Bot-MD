import axios from 'axios';
import fs from 'fs';
import getFbVideoInfo from 'fb-downloader-scrapper';
let enviando = false;

const handler = async (m, { conn, args, command, usedPrefix }) => {
  const idioma = global.db.data.users[m.sender].language || global.defaultLenguaje;
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`));
  const tradutor = _translate.plugins.descargas_facebook;

  if (!args[0]) {
    throw `_*${tradutor.texto1[0]}*_\n\n*${tradutor.texto1[1]}*\n\n*${tradutor.texto1[2]}* _${usedPrefix + command} https://fb.watch/fOTpgn6UFQ/_`;
  }

  if (!enviando) enviando = true;
  try {
    const videoUrl = await getFacebookVideoUrl(args[0]);
    const videoBuffer = await getBuffer(videoUrl);
    await conn.sendMessage(m.chat, { video: videoBuffer, filename: 'video.mp4', caption: `_*${tradutor.texto4}*_` }, { quoted: m });
    enviando = false;
  } catch (error) {
    console.error('Error occurred:', error);
    enviando = false;
    throw `_*${tradutor.texto5}*_`;
  }
};

handler.command = /^(facebook|fb|facebookdl|fbdl|facebook2|fb2|facebookdl2|fbdl2|facebook3|fb3|facebookdl3|fbdl3|facebook4|fb4|facebookdl4|fbdl4|facebook5|fb5|facebookdl5|fbdl5)$/i;
export default handler;

const getBuffer = async (url, options = {}) => {
  const res = await axios({
    method: 'get',
    url,
    headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 },
    ...options,
    responseType: 'arraybuffer'
  });
  return res.data;
};

const getFacebookVideoUrl = async (url) => {
  try {
    const cookies = fs.readFileSync('cookies-facebook.txt', 'utf8').trim();
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    const result = await getFbVideoInfo(url, cookies, userAgent);
    if (result.hd) {
      return result.hd;
    } else if (result.sd) {
      return result.sd;
    } else {
      throw new Error('Video URL not found');
    }
  } catch (error) {
    console.error('Failed to extract video URL:', error);
    throw new Error('Failed to extract video URL');
  }
};