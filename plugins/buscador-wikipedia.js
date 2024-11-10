import axios from 'axios';
import cheerio from 'cheerio';

async function wikipedia(query) {
  try {
    const link = await axios.get(`https://es.wikipedia.org/wiki/${query}`);
    const $ = cheerio.load(link.data);
    const judul = $('#firstHeading').text().trim();
    const thumb = $('#mw-content-text').find('div.mw-parser-output > div:nth-child(1) > table > tbody > tr:nth-child(2) > td > a > img').attr('src') || `//i.ibb.co/nzqPBpC/http-error-404-not-found.png`;
    const isi = [];
    $('#mw-content-text > div.mw-parser-output').each(function(rayy, Ra) {
      const penjelasan = $(Ra).find('p').text().trim();
      isi.push(penjelasan);
    });
    for (const i of isi) {
      const data = {
        status: link.status,
        result: {
          judul: judul,
          thumb: 'https:' + thumb,
          isi: i
        }
      };
      return data;
    }
  } catch (err) {
    console.error(err);
    return {
      status: 404,
      message: 'No se encontró la página solicitada.'
    };
  }
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `Uso: ${usedPrefix + command} <término de búsqueda>\nEjemplo: ${usedPrefix + command} Estrellas`;
  wikipedia(`${text}`).then((res) => {
    if (res.status === 404) {
      m.reply('No se encontró la página solicitada.');
    } else {
      m.reply(`*Resultado de Wikipedia:*\n\n${res.result.isi}`);
    }
  }).catch((err) => {
    console.error(err);
    m.reply('Hubo un error al buscar en Wikipedia.');
  });
};

handler.help = ['wikipedia'].map((v) => v + ' <término de búsqueda>');
handler.tags = ['internet'];
handler.command = /^(wiki|wikipedia)$/i;
export default handler;