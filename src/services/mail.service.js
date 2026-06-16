const nodemailer = require("nodemailer");

const hasSmtpConfig = () =>
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

exports.sendPasswordResetCode = async ({ to, code }) => {
  if (!hasSmtpConfig()) {
    console.log(`[DEV] Password reset code for ${to}: ${code}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Your Aurix password reset code",
    text: `Your Aurix password reset code is ${code}. This code expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Aurix password reset</h2>
        <p>Your password reset code is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  });
};
