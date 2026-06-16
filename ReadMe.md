# Aurix Backend

Backend service for the Aurix fintech platform, built with Node.js, Express, MongoDB, JWT authentication, wallet management, AI fraud checks, email OTP, WhatsApp OTP, and multi-currency wallet flows.

## Overview

The backend currently supports:

- Signup and email/password login
- Remember me login sessions
- Google and Apple social login
- Phone login using WhatsApp OTP
- Forgot password using email OTP
- Wallet creation per user
- Wallet PIN setup and PIN-protected payments
- Multi-currency balances
- Add money flow
- Currency conversion
- Send money by username
- Transaction history for dashboard activity
- AI fraud detection before sending money

## Tech Stack

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT
- bcrypt
- Axios
- Nodemailer
- Twilio WhatsApp
- Nodemon

## Project Structure

```text
src
  config
  controllers
    auth.controller.js
    home.controller.js
    transaction.controller.js
    wallet.controller.js
  middleware
    auth.js
  models
    Transaction.js
    User.js
    Wallet.js
  routes
    auth.routes.js
    home.routes.js
    transaction.routes.js
    wallet.routes.js
  services
    aiCheck.service.js
    mail.service.js
    walletBalance.service.js
    whatsapp.service.js
  app.js
  server.js
```

## Environment Variables

Create a `.env` file in the backend root.

```env
PORT=4000
MONGO_URI=
JWT_SECRET=
AI_BASE_URL=http://127.0.0.1:8001

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=+14155238886

APPLE_CLIENT_ID=
```

Notes:

- `.env` is ignored by git. Do not commit real secrets.
- `SMTP_PASS` should be an app password when using Gmail.
- `APPLE_CLIENT_ID` must match the Apple Service ID used by the frontend.
- Google login is verified using the Google access token received from the frontend.

## Installation

```bash
npm install
```

## Run

```bash
npm run dev
```

Server runs on:

```text
http://localhost:4000
```

## Health Check

```http
GET /
```

Response:

```json
{
  "ok": true,
  "service": "aurix"
}
```

## Authentication

### Signup

```http
POST /auth/signup
```

Request:

```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "username": "jane_doe",
  "email": "jane@example.com",
  "phoneNumber": "+491234567890",
  "password": "Password123!",
  "membershipType": 1
}
```

Behavior:

- Creates the user
- Hashes the password
- Creates a wallet with zero balances for supported currencies

### Email Login

```http
POST /auth/login
```

Request:

```json
{
  "email": "jane@example.com",
  "password": "Password123!",
  "rememberMe": true
}
```

Behavior:

- `rememberMe: true` returns a JWT valid for 30 days
- `rememberMe: false` returns a JWT valid for 2 hours
- Passwords are never remembered or returned

Response:

```json
{
  "token": "JWT_TOKEN",
  "rememberMe": true,
  "user": {
    "id": "USER_ID",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@example.com",
    "username": "jane_doe",
    "phoneNumber": "+491234567890",
    "membershipType": 1,
    "authProvider": "local"
  }
}
```

### Social Login

```http
POST /auth/social-login
```

Google request:

```json
{
  "provider": "google",
  "accessToken": "GOOGLE_ACCESS_TOKEN",
  "rememberMe": true
}
```

Apple request:

```json
{
  "provider": "apple",
  "idToken": "APPLE_ID_TOKEN",
  "rememberMe": true
}
```

Behavior:

- Verifies the provider token
- Creates the user if the email does not already exist
- Creates a wallet if needed
- Returns an Aurix JWT token

### Phone Login With WhatsApp OTP

Request OTP:

```http
POST /auth/phone/request-otp
```

```json
{
  "phoneNumber": "+491234567890"
}
```

Verify OTP:

```http
POST /auth/phone/verify-otp
```

```json
{
  "phoneNumber": "+491234567890",
  "code": "123456",
  "rememberMe": true
}
```

### Forgot Password With Email OTP

Request reset code:

```http
POST /auth/forgot-password
```

```json
{
  "email": "jane@example.com"
}
```

Verify reset code:

```http
POST /auth/verify-reset-code
```

```json
{
  "email": "jane@example.com",
  "code": "123456"
}
```

Reset password:

```http
POST /auth/reset-password
```

```json
{
  "email": "jane@example.com",
  "code": "123456",
  "password": "NewPassword123!"
}
```

## Dashboard

```http
GET /home
Authorization: Bearer JWT_TOKEN
```

Returns wallet balances, daily changes, and transaction lists used by the frontend dashboard.

## Wallet

All wallet routes require:

```http
Authorization: Bearer JWT_TOKEN
```

### Get Wallet Balance

```http
GET /wallet/balance
```

### Set Wallet PIN

```http
POST /wallet/pin
```

```json
{
  "pin": "1234"
}
```

### Add Money Quote

```http
POST /wallet/add-money/quote
```

```json
{
  "amount": 100,
  "fromCurrency": "USD",
  "toCurrency": "EUR"
}
```

### Confirm Add Money

```http
POST /wallet/add-money/confirm
```

```json
{
  "amount": 100,
  "convertedAmount": 92,
  "fromCurrency": "USD",
  "toCurrency": "EUR",
  "note": "Top up",
  "pin": "1234"
}
```

### Convert Currency Quote

```http
POST /wallet/convert/quote
```

```json
{
  "amount": 50,
  "fromCurrency": "EUR",
  "toCurrency": "USD"
}
```

### Convert Currency

```http
POST /wallet/convert
```

```json
{
  "amount": 50,
  "fromCurrency": "EUR",
  "toCurrency": "USD",
  "pin": "1234"
}
```

## Transactions

All transaction routes require:

```http
Authorization: Bearer JWT_TOKEN
```

### Send Money

```http
POST /api/transactions/send
```

```json
{
  "toUsername": "receiver_user",
  "amount": 25,
  "currency": "EUR",
  "pin": "1234",
  "device_id": "web-client",
  "location": "DE"
}
```

Behavior:

- Validates wallet PIN
- Finds recipient by username
- Checks sender balance in the selected currency
- Calls the AI fraud service
- Debits sender and credits recipient if approved
- Creates transaction records

### Transaction Lists

```http
GET /api/transactions/history
GET /api/transactions/pending
GET /api/transactions/completed
```

## AI Fraud Check

The backend calls the AI service before executing send-money transactions.

Configured base URL:

```env
AI_BASE_URL=http://127.0.0.1:8001
```

Expected AI endpoint:

```http
POST /v1/fraud-score
```

Example payload:

```json
{
  "user_id": "USER_ID",
  "amount": 100,
  "currency": "EUR",
  "device_id": "web-client",
  "location": "DE",
  "timestamp": "2026-06-16T10:00:00.000Z"
}
```

AI decisions:

```text
APPROVE - execute transaction
REVIEW  - hold or reject depending on current policy
BLOCK   - reject transaction
```

## Supported Currencies

The current wallet balance object supports:

```text
EUR, USD, GBP, NGN, GHS, KES
```

## Security Notes

- Passwords are hashed with bcrypt.
- Reset codes and phone OTP codes are hashed before storing.
- JWT protects private routes.
- Wallet PIN is required for send money, add money confirmation, and conversion.
- `.env` is ignored and should never be committed.
- Remember me stores a longer-lived JWT, not the user's password.

## Basic QA Checklist

- Signup creates user and wallet
- Duplicate email returns conflict
- Email login returns JWT
- Remember me login returns longer JWT
- Phone OTP sends WhatsApp code
- Forgot password sends email code
- Wallet PIN can be set
- Add money updates the correct currency balance
- Send money debits sender and credits recipient
- Send money rejects invalid PIN
- Convert debits one currency and credits another
- Dashboard `/home` returns balances and recent activity
