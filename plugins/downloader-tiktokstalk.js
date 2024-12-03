import axios from 'axios';
import puppeteer from 'puppeteer';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

const handler = async (m, { conn, text }) => {
  const datas = global;
  const idioma = datas.db.data.users[m.sender].language || global.defaultLenguaje;
  const _translate = JSON.parse(fs.readFileSync(`./src/languages/${idioma}.json`));
  const tradutor = _translate.plugins.downloader_tiktokstalk;

  if (!text) return conn.reply(m.chat, tradutor.texto1, m);

  let browser;

  try {
    const cookies = JSON.parse(await readFile('cookies-instagram.txt', 'utf8'));

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.goto(`https://www.instagram.com/${text}/`, { waitUntil: 'networkidle2' });

    const user = await page.evaluate(() => {
      const username = document.querySelector('span.x1lliihq.x193iq5w.x6ikm8r.x10wlt62.xlyipyv.xuxw1ft')?.innerText || '';
      const fullName = document.querySelector('span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x1ji0vk5.x18bv5gf.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xvs91rp.x1s688f.x5n08af.x10wh9bi.x1wdrske.x8viiok.x18hxmgj')?.innerText || '';
      const followerCount = document.querySelector('a[href$="/followers/"] span.html-span')?.innerText || '';
      const followingCount = document.querySelector('a[href$="/following/"] span.html-span')?.innerText || '';
      const mediaCount = document.querySelector('li.xl565be.x1m39q7l.x1uw6ca5.x2pgyrj span.x5n08af.x1s688f span.html-span')?.innerText || '';
      const biography = document.querySelector('span._ap3a._aaco._aacu._aacx._aad7._aade')?.innerText || '';
      const profilePicUrl = document.querySelector('img.xpdipgo.x972fbf.xcfux6l.x1qhh985.xm0m39n.xk390pu.x5yr21d.xdj266r.x11i5rnm.xat24cr.x1mh8g0r.xl1xv1r.xexx8yu.x4uap5.x18d9i69.xkhd6sd.x11njtxf.xh8yej3')?.src || '';

      return {
        username,
        fullName,
        followerCount,
        followingCount,
        mediaCount,
        biography,
        profilePicUrl
      };
    });

    if (!user.profilePicUrl) {
      throw new Error('Profile picture URL is invalid');
    }

    const Mystic = `
${tradutor.texto2[0]} ${user.username}
${tradutor.texto2[1]} ${user.fullName}
${tradutor.texto2[2]} ${user.followerCount}
${tradutor.texto2[3]} ${user.followingCount}
${tradutor.texto2[4]} ${user.mediaCount}
${tradutor.texto2[6]} ${user.biography || 'N/A'}
`.trim();

    const imageUrl = user.profilePicUrl;
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data, "binary");

    await conn.sendFile(m.chat, imageBuffer, 'profile.jpg', Mystic, m);
  } catch (e) {
    console.error('Error occurred:', e);
    throw tradutor.texto3;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

handler.help = ['igprofile'].map((v) => v + ' <username>');
handler.tags = ['stalk'];
handler.command = /^(igprofile|igstalk|igs)$/i;
export default handler;