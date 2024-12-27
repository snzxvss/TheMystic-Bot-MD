import { exec } from 'child_process';

const handler = async (m, { conn, text }) => {
  const args = text.split('|');
  if (args.length < 4) {
    return m.reply('⚠️ Por favor, proporciona todos los parámetros: \n\ncorreo@remitente | correo@destinatario | asunto | mensaje 📧');
  }

  const [to, from, subject, message] = args;

  const command = `/root/swaks --auth --server smtp.mailgun.org --port 587 --au test@camilosanz.tech --ap sanzvoss --from ${from} --to ${to} --h-Subject: "${subject}" --h-From: "<${from}>" --body '${message}'`;

  await m.reply(`📧 *Enviando correo con los siguientes datos:*\n
📬 *Para:* _${to}_
📤 *De:* _${from}_
📝 *Asunto:* _${subject}_
✉️ *Mensaje:* _${message}_`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al enviar el correo: ${error.message}`);
      return m.reply('Hubo un error al enviar el correo.');
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return m.reply('Hubo un error al enviar el correo.');
    }
    console.log(`stdout: ${stdout}`);
    m.reply('> 📧 Correo enviado exitosamente.');
  });
};

handler.command = /^(ec|correo)$/i;
export default handler;