import fetch from 'node-fetch';
import axios from 'axios';
import translate from '@vitalets/google-translate-api';
import { Configuration, OpenAIApi } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const configuration = new Configuration({ organization: global.openai_org_id, apiKey: global.openai_key });
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const handler = async (m, { conn, text, usedPrefix, command }) => {
  const datas = global;
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje;
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`));
  const tradutor = _translate.plugins.herramientas_chatgpt;

  if (usedPrefix == 'a' || usedPrefix == 'A') return;
  if (!text && !m.quoted) throw `${tradutor.texto1[0]} ${usedPrefix + command} ${tradutor.texto1[1]} ${usedPrefix + command} ${tradutor.texto1[2]}`;

  try {
    conn.sendPresenceUpdate('composing', m.chat);

    if (command === 'gimagina') {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateImage({
        prompt: text,
        num_images: 1,
        size: '1024x1024'
      });
      const imageUrl = result.data[0].url;
      await conn.sendMessage(m.chat, { image: { url: imageUrl }, caption: tradutor.texto5 }, { quoted: m });
    } else if (m.quoted && m.quoted.mimetype && m.quoted.mimetype.startsWith('image/')) {
      const media = await conn.downloadMediaMessage(m.quoted);
      const base64Image = Buffer.from(media).toString('base64');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([
        text,
        { inlineData: { data: base64Image, mimeType: m.quoted.mimetype } }
      ]);
      const responseText = result.response.text();
      m.reply(responseText.trim());
    } else {
      const salesMessageResponse = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
        {
          contents: [
            {
              parts: [
                {
                  text: text,
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          params: {
            key: 'AIzaSyCFFnGrWC4r8NqRGFLN1R-WjmeoPvCfZiI', // Reemplaza con tu clave API de Gemini
          },
        }
      );

      const salesMessage = salesMessageResponse.data.candidates[0].content.parts[0].text;
      m.reply(salesMessage.trim());
    }
  } catch (error) {
    console.error(error);
    throw tradutor.texto4;
  }
};

handler.command = /^(g|gimagina)$/i;
export default handler;