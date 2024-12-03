import fs from 'fs';

const deletedMessagesFile = './deletedMessages.json';
let deletedMessages = [];

// Load deleted messages from file
if (fs.existsSync(deletedMessagesFile)) {
  deletedMessages = JSON.parse(fs.readFileSync(deletedMessagesFile));
}

const handler = async (m, { conn }) => {
  // Capturar mensajes eliminados
  if (m.message && m.message.protocolMessage && m.message.protocolMessage.type === 0) {
    try {
      const key = m.message.protocolMessage.key;
      const message = await conn.loadMessage(key.remoteJid, key.id);

      if (!message) return;

      deletedMessages.push(message.message);
      fs.writeFileSync(deletedMessagesFile, JSON.stringify(deletedMessages, null, 2));
      console.log('Mensaje eliminado capturado y guardado.');

      // Enviar notificación de mensaje eliminado
      const notificationText = "Se ha eliminado un mensaje.";
      await conn.sendMessage(m.chat, { text: notificationText }, { quoted: m });

    } catch (e) {
      console.error(e);
    }
    return;
  }

  // Reenviar el último mensaje eliminado
  if (m.text && m.text.toLowerCase() === 'reenviar') {
    if (deletedMessages.length === 0) {
      return m.reply("No hay mensajes eliminados recientemente.");
    }

    try {
      const quoted = deletedMessages.pop();
      fs.writeFileSync(deletedMessagesFile, JSON.stringify(deletedMessages, null, 2));
      const users = [m.sender];
      const htextos = "Mensaje eliminado:";

      if (quoted.imageMessage) {
        const mediax = await conn.downloadMediaMessage(quoted);
        await conn.sendMessage(m.chat, { image: mediax, caption: htextos, mentions: users }, { quoted: m });
      } else if (quoted.videoMessage) {
        const mediax = await conn.downloadMediaMessage(quoted);
        await conn.sendMessage(m.chat, { video: mediax, caption: htextos, mentions: users }, { quoted: m });
      } else if (quoted.audioMessage) {
        const mediax = await conn.downloadMediaMessage(quoted);
        await conn.sendMessage(m.chat, { audio: mediax, mimetype: 'audio/mpeg', fileName: `Reenviado.mp3`, mentions: users }, { quoted: m });
      } else if (quoted.stickerMessage) {
        const mediax = await conn.downloadMediaMessage(quoted);
        await conn.sendMessage(m.chat, { sticker: mediax, mentions: users }, { quoted: m });
      } else if (quoted.conversation || quoted.extendedTextMessage) {
        const text = quoted.conversation || quoted.extendedTextMessage.text;
        await conn.sendMessage(m.chat, { text: `${htextos}\n\n${text}`, mentions: users }, { quoted: m });
      }
      console.log('Mensaje eliminado reenviado.');
    } catch (e) {
      console.error(e);
    }
  }
};

handler.all = async (m) => {
  await handler(m, { conn: m.conn });
};

handler.command = /^(reenviar|forwarddeleted)$/i;
handler.group = true;
handler.admin = true;
export default handler;