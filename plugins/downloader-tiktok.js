import axios from 'axios';
import cheerio from 'cheerio';
import { generateWAMessageFromContent } from "baileys";
import { tiktokdl } from '@bochilteam/scraper';
import { downloadTiktok, getBufferFromURL, getBestMediaWithinLimit, filterNoWatermark, filterVideo, filterAudio } from './tiktok-convert'; // Asegúrate de ajustar la ruta según tu estructura de proyecto

const handler = async (m, { conn, text, args, usedPrefix, command }) => {
  const datas = global;
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje;
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`));
  const tradutor = _translate.plugins.descargas_tiktok;

  if (!text) throw `${tradutor.texto1} _${usedPrefix + command} https://vm.tiktok.com/ZM686Q4ER/_`;
  if (!/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok.com\/([^\s&]+)/gi.test(text)) throw `${tradutor.texto2} _${usedPrefix + command} https://vm.tiktok.com/ZM686Q4ER/_`;
  const texto = `${tradutor.texto3}`;

  try {
    const aa = { quoted: m, userJid: conn.user.jid };
    const prep = generateWAMessageFromContent(m.chat, { extendedTextMessage: { text: texto, contextInfo: { externalAdReply: { title: 'ᴛʜᴇ ᴍʏsᴛɪᴄ - ʙᴏᴛ', body: null, thumbnail: imagen1, sourceUrl: 'https://github.com/BrunoSobrino/TheMystic-Bot-MD' }, mentionedJid: [m.sender] } } }, aa);
    await conn.relayMessage(m.chat, prep.message, { messageId: prep.key.id, mentions: [m.sender] });

    const result = await downloadTiktok(args[0]);
    const noWatermark = filterNoWatermark(result.medias);
    const bestMedia = getBestMediaWithinLimit(noWatermark, 50 * 1024 * 1024); // 50 MB limit

    if (!bestMedia) throw new Error('No se encontró un video adecuado sin marca de agua.');

    const buffer = await getBufferFromURL(bestMedia.url);
    const desc = `${tradutor.texto4[0]} _${usedPrefix}tomp3_ ${tradutor.texto4[1]}`;
    await conn.sendMessage(m.chat, { video: buffer, caption: desc }, { quoted: m });
  } catch (err) {
    console.error(err);
    throw `Error al descargar el contenido. Asegúrate de que el enlace sea correcto.\n*◉ https://www.tiktok.com/`;
  }
};

handler.command = /^(tiktok|ttdl|tiktokdl|tiktoknowm|tt|ttnowm|tiktokaudio)$/i;
export default handler;