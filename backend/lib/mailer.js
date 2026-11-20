const nodemailer = require('nodemailer');

const port = Number(process.env.SMTP_PORT || 465);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function sendResetCode(to, name, code) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_USER / SMTP_PASS manquants dans le fichier .env');
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Réinitialisation de ton mot de passe',
    text:
      `Bonjour ${name},\n\n` +
      `Voici ton code de réinitialisation : ${code}\n\n` +
      `Il est valable 15 minutes. Si tu n'as rien demandé, ignore cet email : ton mot de passe ne change pas.`,
    html:
      `<div style="font-family:Arial,sans-serif;max-width:420px">` +
      `<p>Bonjour ${escapeHtml(name)},</p>` +
      `<p>Voici ton code de réinitialisation :</p>` +
      `<p style="font-size:32px;font-weight:bold;letter-spacing:6px">${code}</p>` +
      `<p>Il est valable 15 minutes. Si tu n'as rien demandé, ignore cet email : ton mot de passe ne change pas.</p>` +
      `</div>`,
  });
}

module.exports = { sendResetCode };