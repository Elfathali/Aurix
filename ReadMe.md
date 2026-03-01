Backend service for Aurix MVP Demo.

This API provides:

Authentication (JWT)

Wallet system

Transactions

AI Fraud Check integration (mock + replaceable)

📦 Tech Stack

Node.js

Express

MongoDB (Mongoose)

JWT Authentication

Nodemon (dev)

⚙️ Setup
1️⃣ Install dependencies
npm install
2️⃣ Create .env file
PORT=4000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aurix
JWT_SECRET=supersecretkey
AI_CHECK_URL=http://localhost:5001/check   # optional for real AI later
AI_FORCE_DECISION=                         # APPROVE / REVIEW / BLOCK (for testing)
3️⃣ Run server
npm run dev

Server will run on:

http://localhost:4000
🔐 Authentication

All protected endpoints require:

Authorization: Bearer <TOKEN>
📌 API Endpoints
1️⃣ Health Check
GET /

Response

{
  "ok": true,
  "service": "aurix"
}
2️⃣ Signup
POST /auth/signup

Body

{
  "email": "user@test.com",
  "password": "123456"
}

Success

{
  "message": "User created"
}

Errors

{ "message": "email and password are required" }
{ "message": "User already exists" }
3️⃣ Login
POST /auth/login

Body

{
  "email": "user@test.com",
  "password": "123456"
}

Success

{
  "token": "JWT_TOKEN_HERE"
}
4️⃣ Get Wallet Balance
GET /wallet/me

Headers

Authorization: Bearer <TOKEN>

Response

{
  "userId": "USER_ID",
  "balance": 100
}
5️⃣ Credit Wallet (Add Money – Demo)

Used by Stripe integration later.

POST /wallet/credit

Body

{
  "userId": "USER_ID",
  "amount": 500
}

Response

{
  "message": "Wallet credited",
  "wallet": {
    "balance": 500
  }
}
6️⃣ Send Money (MAIN FEATURE)
POST /tx/send

Headers

Authorization: Bearer <TOKEN>

Body

{
  "toEmail": "receiver@test.com",
  "amount": 100
}
🤖 AI Fraud Check

Before any transaction is processed, backend calls AI service.

Currently implemented as:

Mock AI (random decision)

Replaceable with real AI endpoint via aiCheck.service.js


📊 Possible Responses
✅ APPROVED
{
  "status": "APPROVED",
  "message": "Transaction successful",
  "ai": {
    "fraudScore": 0.21,
    "decision": "APPROVE",
    "reason": "Low risk"
  }
}
❌ BLOCKED
{
  "status": "BLOCKED",
  "message": "Transaction blocked by AI",
  "ai": {
    "fraudScore": 0.91,
    "decision": "BLOCK",
    "reason": "High risk"
  }
}

🚫 Possible Errors
Insufficient Balance
{
  "message": "Insufficient balance"
}
Receiver not found
{
  "message": "Receiver not found"
}
Unauthorized
{
  "message": "Missing token"
}
🧪 Testing Guide (Postman)
1) Signup 2 users

a@test.com

b@test.com

2) Login as A

→ copy token

3) Credit wallet
POST /wallet/credit
{
  "userId": "A_ID",
  "amount": 500
}
4) Send money
POST /tx/send
{
  "toEmail": "b@test.com",
  "amount": 100
}

You will get:

APPROVED / BLOCKED / REVIEW

🎯 Demo Flow
Login → Dashboard → Add Money → Send Money
→ AI Fraud Decision → Popup → Success / Blocked
🔄 AI Integration (for AI Team)

Replace inside:

src/services/aiCheck.service.js

Current mock:

Math.random()

Replace with:

axios.post(AI_CHECK_URL, payload)

Expected AI response format:

{
  "fraudScore": 0.82,
  "decision": "BLOCK",
  "reason": "High risk"
}