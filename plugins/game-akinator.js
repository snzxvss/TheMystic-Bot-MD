import { Aki } from 'aki-api';
import translate from '@vitalets/google-translate-api';

const handler = async (m, { conn, usedPrefix, command, text }) => {
  const datas = global;
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje;
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`));
  const tradutor = _translate.plugins.game_akinator;

  if (m.isGroup) return;
  const aki = global.db.data.users[m.sender].akinator;
  if (text == 'end') {
    if (!aki.sesi) return m.reply(tradutor.texto1);
    aki.sesi = false;
    aki.soal = null;
    m.reply(tradutor.texto2);
  } else {
    if (aki.sesi) {
      try {
        const akiInstance = aki.akiInstance;
        const answer = text.toLowerCase();
        let answerIndex;

        switch (answer) {
          case 'yes':
          case 'y':
          case 'si':
            answerIndex = 0;
            break;
          case 'no':
          case 'n':
            answerIndex = 1;
            break;
          case 'i don\'t know':
          case 'idk':
          case 'no sé':
            answerIndex = 2;
            break;
          case 'probably':
          case 'probably yes':
          case 'probablemente':
            answerIndex = 3;
            break;
          case 'probably not':
          case 'probablemente no':
            answerIndex = 4;
            break;
          default:
            return m.reply(tradutor.texto7); // Mensaje de respuesta no válida
        }

        await akiInstance.step(answerIndex);
        const resultes2 = await translate(akiInstance.question, { to: 'es', autoCorrect: false });
        let txt = `${tradutor.texto5[0]} @${m.sender.split('@')[0]}*\n${tradutor.texto5[1]} ${resultes2.text}*\n\n`;
        txt += tradutor.texto5[2];
        txt += tradutor.texto5[3];
        txt += tradutor.texto5[4];
        txt += tradutor.texto5[5];
        txt += tradutor.texto5[6];
        txt += `${tradutor.texto5[7]}  ${usedPrefix + command} ${tradutor.texto5[8]}`;
        const soal = await conn.sendMessage(m.chat, { text: txt, mentions: [m.sender] }, { quoted: m });
        aki.soal = soal;
      } catch {
        m.reply(tradutor.texto6);
      }
    } else {
      try {
        const akiInstance = new Aki({ region: 'es' });
        await akiInstance.start();
        aki.sesi = true;
        aki.akiInstance = akiInstance;
        const resultes2 = await translate(akiInstance.question, { to: 'es', autoCorrect: false });
        let txt = `${tradutor.texto5[0]} @${m.sender.split('@')[0]}*\n${tradutor.texto5[1]} ${resultes2.text}*\n\n`;
        txt += tradutor.texto5[2];
        txt += tradutor.texto5[3];
        txt += tradutor.texto5[4];
        txt += tradutor.texto5[5];
        txt += tradutor.texto5[6];
        txt += `${tradutor.texto5[7]}  ${usedPrefix + command} ${tradutor.texto5[8]}`;
        const soal = await conn.sendMessage(m.chat, { text: txt, mentions: [m.sender] }, { quoted: m });
        aki.soal = soal;
      } catch {
        m.reply(tradutor.texto6);
      }
    }
  }
};

handler.menu = ['akinator'];
handler.tags = ['game'];
handler.command = /^(akinator)$/i;
export default handler;