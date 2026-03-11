const axios = require("axios");

const AI_BASE_URL = process.env.AI_BASE_URL || "http://127.0.0.1:8001";

async function checkFraud({ userId, amount, currency = "EUR", device_id = "web", location = "DE" }) {
  const aiPayload = {
    user_id: userId,
    amount: Number(amount),
    currency,
    device_id,
    location,
    timestamp: new Date().toISOString(),
  };

  const aiResp = await axios.post(
    `${AI_BASE_URL}/v1/fraud-score`,
    aiPayload,
    { timeout: 5000 }
  );

  return aiResp.data;
}

module.exports = { checkFraud };