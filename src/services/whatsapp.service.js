const twilio = require("twilio");

const hasTwilioConfig = () =>
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_WHATSAPP_FROM;

exports.sendWhatsAppOtp = async ({ to, code }) => {
  if (!hasTwilioConfig()) {
    console.log(`[DEV] WhatsApp login OTP for ${to}: ${code}`);
    return;
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
    to: `whatsapp:${to}`,
    body: `Your Aurix login code is ${code}. This code expires in 10 minutes.`
  });
};
