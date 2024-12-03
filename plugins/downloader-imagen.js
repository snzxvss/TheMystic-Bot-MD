import googleImages from 'google-images';
import fs from 'fs';

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const idioma = global.db.data.users[m.sender].language || global.defaultLenguaje;
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`));
  const tradutor = _translate.plugins.downloader_imagen;

  if (!text) return m.reply(`${tradutor.texto1} ${usedPrefix + command} Minecraft*`);

  // if (m.text.includes('gore') || m.text.includes('cp') ||
  //     m.text.includes('porno') || m.text.includes('Gore') ||
  //     m.text.includes('rule') || m.text.includes('CP') ||
  //     m.text.includes('Rule34')) {
  //   return m.reply('[❗] NO PUEDO ENVIAR ESTE CONTENIDO PORQUE ESTA PROHIBIDO BUSCAR CONTENIDO EXPLICITO');
  // }

  const client = new googleImages('7519af5cc78174bcd', 'AIzaSyAaSy5epYfBP6ouWoCmJKoY1rtJ7hmB5HI');
  try {
    const images = await client.search(text);
    if (images.length === 0) {
      return m.reply(`${tradutor.texto3} ${text}`);
    }
    const link = images[0].url;
    await conn.sendFile(m.chat, link, 'image.jpg', `${tradutor.texto2[0]} ${text}\n${tradutor.texto2[1]} ${link}\n${tradutor.texto2[2]}`, m);
  } catch (error) {
    console.error('Error fetching image:', error);
    m.reply(`${tradutor.texto4}`);
  }
};

handler.help = ['gimage <query>', 'imagen <query>'];
handler.tags = ['internet', 'tools'];
handler.command = /^(gimage|image|imagen)$/i;
export default handler;