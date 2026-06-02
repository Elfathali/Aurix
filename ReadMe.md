Aurix Backend
Backend service for the Aurix Fintech Platform built with Node.js, Express, MongoDB, and AI Fraud Detection (FastAPI).
---
Overview
The backend manages:
JWT Authentication
Wallet balances
Money transfers
AI fraud detection before transaction execution
Transaction validation and security checks
---
Architecture
```text
Frontend (React / Flutter)
        │
        ▼
Node.js Backend (Express)
        │
        │ POST /v1/fraud-score
        ▼
AI Fraud Detection Service (FastAPI)
        │
        ▼
MongoDB (Users / Wallets / Transactions)
```
---
Transaction Flow
```text
User sends money
      │
      ▼
Backend calls AI fraud service
      │
      ├── APPROVE → execute transaction
      ├── REVIEW  → hold transaction
      └── BLOCK   → reject transaction
```
---
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
---
Project Structure
```text
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
```
---
Environment Variables
Create `.env`
```env
PORT=4000

MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/aurix

JWT_SECRET=supersecretkey

AI_BASE_URL=http://127.0.0.1:8001
```
---
Installation
Clone the repository
```bash
git clone https://github.com/YOUR_REPO/aurix-backend.git
cd aurix-backend
```
Install dependencies
```bash
npm install
```
Run the backend
```bash
npm run dev
```
Server runs on:
```text
http://localhost:4000
```
---
AI Service Setup
The AI fraud detection service runs separately using FastAPI.
Navigate to AI project
```bash
cd aurix-ai-main
```
Create virtual environment
```bash
python -m venv venv
```
Activate environment
Windows
```bash
venv\Scripts\activate
```
Install dependencies
```bash
pip install -r requirements.txt
```
Run AI service
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```
AI server will run on:
```text
http://127.0.0.1:8001
```
Swagger documentation:
```text
http://127.0.0.1:8001/docs
```
---
API Documentation
Authentication APIs
---
POST `/auth/signup`
Description
Registers a new user account.
Headers
```http
Content-Type: application/json
```
Request Body
```json
{
  "email": "user@test.com",
  "password": "123456"
}
```
Success Response
```json
{
  "message": "User registered successfully",
  "token": "JWT_TOKEN"
}
```
Error Responses
400 Bad Request
```json
{
  "message": "Email and password are required"
}
```
409 Conflict
```json
{
  "message": "User already exists"
}
```
---
POST `/auth/login`
Description
Authenticates user and returns JWT token.
Request Body
```json
{
  "email": "user@test.com",
  "password": "123456"
}
```
Success Response
```json
{
  "token": "JWT_TOKEN"
}
```
Error Responses
401 Unauthorized
```json
{
  "message": "Invalid credentials"
}
```
---
GET `/wallet/me`
Description
Returns authenticated user's wallet balance.
Headers
```http
Authorization: Bearer JWT_TOKEN
```
Success Response
```json
{
  "balance": 500
}
```
Error Responses
401 Unauthorized
```json
{
  "message": "Invalid token"
}
```
---
POST `/tx/send`

💸 Transaction APIs
Base URL
http://localhost:4000/api/transactions
GET /history
GET http://localhost:4000/api/transactions/history
GET /pending
GET http://localhost:4000/api/transactions/pending
GET /completed
GET http://localhost:4000/api/transactions/completed

Description
Transfers money between users after AI fraud validation.
Headers
```http
Authorization: Bearer JWT_TOKEN
Content-Type: application/json
```
Request Body
```json
{
  "toEmail": "receiver@test.com",
  "amount": 100
}
```
Success Response
```json
{
  "status": "APPROVE",
  "message": "Transaction successful"
}
```
AI Review Response
```json
{
  "status": "REVIEW",
  "message": "Transaction flagged for manual review"
}
```
AI Block Response
```json
{
  "status": "BLOCK",
  "message": "Transaction blocked by AI"
}
```
Error Responses
400 Insufficient Balance
```json
{
  "message": "Insufficient balance"
}
```
404 Recipient Not Found
```json
{
  "message": "Recipient not found"
}
```
---
AI Fraud Check Integration
Before executing a transaction, the backend calls the AI service.
Endpoint used
```http
POST /v1/fraud-score
```
Request sent to AI
```json
{
  "user_id": "user123",
  "amount": 100,
  "currency": "EUR",
  "device_id": "web",
  "location": "DE",
  "timestamp": "2026-02-19T10:00:00Z"
}
```
AI Response
```json
{
  "risk_score": 10,
  "decision": "APPROVE",
  "reasons": ["No risk signals detected"]
}
```
---
AI Decision Handling
Decision	Action
APPROVE	Execute transaction
REVIEW	Hold transaction
BLOCK	Reject transaction
---
QA Test Cases
Test ID	Endpoint	Scenario	Expected Result
TC-001	`/auth/signup`	Valid signup	User created
TC-002	`/auth/signup`	Existing email	409 error
TC-003	`/auth/login`	Valid credentials	JWT returned
TC-004	`/auth/login`	Wrong password	401
TC-005	`/wallet/me`	Valid token	Balance returned
TC-006	`/wallet/me`	Invalid token	401
TC-007	`/tx/send`	Valid transaction	Success
TC-008	`/tx/send`	Insufficient funds	400
TC-009	`/tx/send`	Invalid recipient	404
TC-010	`/tx/send`	AI blocks transaction	BLOCK response
---
Edge Case Validation
Invalid JWT Token
Expected response:
```json
{
  "message": "Invalid token"
}
```
---
Empty Request Body
```json
{}
```
Expected response:
```json
{
  "message": "Required fields missing"
}
```
---
Negative Transaction Amount
```json
{
  "amount": -100
}
```
Expected response:
```json
{
  "message": "Invalid amount"
}
```
---
Transfer To Self
Expected response:
```json
{
  "message": "Cannot transfer money to yourself"
}
```
---
Rapid Multiple Transactions
Scenario
Send multiple transaction requests simultaneously.
Expected Result
No balance corruption
No duplicate transactions
Atomic transaction handling
---
AI Service Offline
Expected response:
```json
{
  "message": "Fraud detection service unavailable"
}
```
---
HTTP Status Codes
Code	Meaning
200	Success
201	Resource created
400	Bad request
401	Unauthorized
403	Forbidden
404	Resource not found
409	Conflict
500	Internal server error
---
Security Notes
Passwords are hashed using bcrypt
JWT authentication protects private routes
AI fraud validation occurs before transaction execution
Sensitive environment variables are stored in `.env`
MongoDB Atlas IP whitelist enabled
---
Testing with Postman
1️⃣ Login
```http
POST /auth/login
```
Copy JWT token.
---
2️⃣ Send transaction
```http
POST /tx/send
```
Headers
```http
Authorization: Bearer TOKEN
```
Body
```json
{
  "toEmail": "receiver@test.com",
  "amount": 100
}
```
---
Health Check (AI Service)
```http
GET http://127.0.0.1:8001/v1/health
---