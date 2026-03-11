Aurix Backend

Backend service for the Aurix Fintech Platform built with Node.js, Express, MongoDB, and AI Fraud Detection (FastAPI).

The backend manages:

Authentication (JWT)

Wallet balances

Money transfers

AI fraud detection before transaction execution

Architecture
Frontend (React / Flutter)
        │
        ▼
Node.js Backend (Express)
        │
        │  POST /v1/fraud-score
        ▼
AI Fraud Detection Service (FastAPI)
        │
        ▼
MongoDB (Users / Wallets / Transactions)

Transaction flow:

User sends money
      │
      ▼
Backend calls AI fraud service
      │
      ├── APPROVE → execute transaction
      ├── REVIEW  → hold transaction
      └── BLOCK   → reject transaction
Tech Stack

Backend

Node.js

Express.js

MongoDB

Mongoose

JWT Authentication

AI Service

Python

FastAPI

Uvicorn

Tools

Postman

Nodemon

Axios

Project Structure
src
 ├── config
 ├── controllers
 │    ├── auth.controller.js
 │    ├── wallet.controller.js
 │    └── transaction.controller.js
 │
 ├── middleware
 │    └── auth.js
 │
 ├── models
 │    ├── User.js
 │    ├── Wallet.js
 │    └── Transaction.js
 │
 ├── routes
 │    ├── auth.routes.js
 │    ├── wallet.routes.js
 │    └── transaction.routes.js
 │
 ├── services
 │    └── aiCheck.service.js
 │
 ├── app.js
 └── server.js

.env
package.json
README.md
Environment Variables

Create .env

PORT=4000

MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aurix

JWT_SECRET=supersecretkey

AI_BASE_URL=http://127.0.0.1:8001
Installation

Clone the repository

git clone https://github.com/YOUR_REPO/aurix-backend.git
cd aurix-backend

Install dependencies

npm install

Run the backend

npm run dev

Server runs on:

http://localhost:4000
AI Service Setup

The AI fraud detection service runs separately using FastAPI.

Navigate to AI project:

cd aurix-ai-main

Create virtual environment

python -m venv venv

Activate environment

Windows:

venv\Scripts\activate

Install dependencies

pip install -r requirements.txt

Run AI service

python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

AI server will run on:

http://127.0.0.1:8001

Swagger documentation:

http://127.0.0.1:8001/docs
API Endpoints
Authentication
Register user
POST /auth/signup

Body:

{
  "email": "user@test.com",
  "password": "123456"
}
Login
POST /auth/login

Response:

{
  "token": "JWT_TOKEN"
}
Wallet
Get wallet balance
GET /wallet/me

Header:

Authorization: Bearer TOKEN
Transactions
Send money
POST /tx/send

Headers

Authorization: Bearer TOKEN

Body

{
  "toEmail": "receiver@test.com",
  "amount": 100
}
AI Fraud Check Integration

Before executing a transaction, the backend calls the AI service.

Endpoint used:

POST /v1/fraud-score

Request sent to AI:

{
  "user_id": "user123",
  "amount": 100,
  "currency": "EUR",
  "device_id": "web",
  "location": "DE",
  "timestamp": "2026-02-19T10:00:00Z"
}

AI Response:

{
  "risk_score": 10,
  "decision": "APPROVE",
  "reasons": ["No risk signals detected"]
}
AI Decision Handling

The backend processes the AI response:

Decision	Action
APPROVE	Execute transaction
REVIEW	Hold transaction
BLOCK	Reject transaction

Example blocked response:

{
  "status": "BLOCK",
  "message": "Transaction blocked by AI",
  "ai": {
    "risk_score": 90,
    "decision": "BLOCK"
  }
}
Testing with Postman

1️⃣ Login

POST /auth/login

Copy JWT token.

2️⃣ Send transaction

POST /tx/send

Headers

Authorization: Bearer TOKEN

Body

{
  "toEmail": "receiver@test.com",
  "amount": 100
}
Health Check (AI Service)
GET http://127.0.0.1:8001/v1/health