# MarketRun API Documentation

## Backend REST API Specification & Data Model Reference

---

## 1. Authentication

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| POST | `/api/auth/signup` | Create new account with mandatory email verification |
| POST | `/api/auth/login` | Authenticate via email and password credentials |
| POST | `/api/auth/send-verification` | Send OTP verification code to registered email |
| POST | `/api/auth/verify-email` | Verify OTP code for email confirmation |
| POST | `/api/auth/forgot-password` | Initiate password reset flow by sending OTP |
| POST | `/api/auth/reset-password` | Verify reset OTP and update user password |

### POST /api/auth/signup
Create a new user account. Email verification is required before account activation.

**Request Body:**
```json
{
  "name": "Adebayo Ogunlesi",
  "email": "adebayo@example.com",
  "password": "securepassword123",
  "estate": "Lekki Gardens Phase 3"
}
```

**Response (200):**
```json
{
  "id": "clx1234...",
  "name": "Adebayo Ogunlesi",
  "email": "adebayo@example.com",
  "estate": "Lekki Gardens Phase 3",
  "role": "requester"
}
```

**Response (400):**
```json
{ "error": "Email already exists" }
```

### POST /api/auth/login
Authenticate with email and password. Returns a JWT token in an httpOnly cookie.

**Request Body:**
```json
{
  "email": "adebayo@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "clx1234...",
    "name": "Adebayo Ogunlesi",
    "email": "adebayo@example.com",
    "role": "requester"
  }
}
```

**Cookie:** `marketrun_token` (httpOnly, secure, sameSite: lax, 7-day expiry)

### POST /api/auth/send-verification
Send a 6-digit OTP code to the user's email for verification.

**Request Body:**
```json
{
  "email": "adebayo@example.com",
  "purpose": "signup"
}
```

**Response (200):**
```json
{
  "success": true,
  "code": "482916"
}
```

### POST /api/auth/verify-email
Verify the 6-digit OTP code sent to the user's email.

**Request Body:**
```json
{
  "email": "adebayo@example.com",
  "code": "482916",
  "purpose": "signup"
}
```

**Response (200):**
```json
{ "success": true }
```

### POST /api/auth/forgot-password
Initiate password reset flow by sending an OTP code to the user's email.

**Request Body:**
```json
{
  "email": "adebayo@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "code": "739201"
}
```

### POST /api/auth/reset-password
Verify the reset OTP and update the user's password.

**Request Body:**
```json
{
  "email": "adebayo@example.com",
  "code": "739201",
  "newPassword": "newsecurepassword456"
}
```

**Response (200):**
```json
{ "success": true }
```

---

## 2. Errands

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| GET | `/api/errands` | List all errands (filterable by target market, status) |
| POST | `/api/errands` | Create and publish a new errand request |
| GET | `/api/errands/[id]` | Retrieve detailed information for a specific errand |
| PATCH | `/api/errands/[id]` | Update errand status (accept, fund, shop, deliver, complete, cancel) |

### GET /api/errands
List errands with optional filters and pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 12 | Items per page |
| `market` | string | - | Filter by market name |
| `status` | string | - | Filter by status |
| `search` | string | - | Search title/description |
| `mine` | string | - | `requester` or `shopper` for own errands |

**Response (200):**
```json
{
  "errands": [
    {
      "id": "clx1234...",
      "title": "Sunday Jollof Rice Party Supplies",
      "description": "Need ingredients for 50 guests",
      "market": "Mile 12 Market",
      "items": "[{\"name\":\"Rice\",\"quantity\":\"10kg\",\"maxBudget\":12000}]",
      "budget": 45000,
      "reward": 5000,
      "status": "OPEN",
      "address": "12 Admiralty Way, Lekki Phase 1",
      "estate": "Lekki Gardens",
      "requester": {
        "id": "clx1234...",
        "name": "Adebayo Ogunlesi",
        "estate": "Lekki Gardens",
        "rating": 5.0
      },
      "shopper": null,
      "requesterId": "clx1234...",
      "shopperId": null,
      "createdAt": "2026-07-19T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 6,
    "totalPages": 1,
    "hasMore": false
  }
}
```

### POST /api/errands
Create and publish a new errand request.

**Request Body:**
```json
{
  "title": "Sunday Jollof Rice Party Supplies",
  "description": "Need ingredients for 50 guests",
  "market": "Mile 12 Market",
  "items": [
    { "name": "Rice", "quantity": "10kg", "brand": "Mama Gold", "maxBudget": 12000 },
    { "name": "Chicken", "quantity": "5kg", "maxBudget": 8000 },
    { "name": "Tomatoes", "quantity": "3 baskets", "maxBudget": 3000 }
  ],
  "budget": 23000,
  "reward": 5000,
  "address": "12 Admiralty Way, Lekki Phase 1",
  "estate": "Lekki Gardens"
}
```

**Response (201):**
```json
{
  "id": "clx1234...",
  "title": "Sunday Jollof Rice Party Supplies",
  "status": "OPEN",
  "createdAt": "2026-07-19T10:30:00.000Z"
}
```

**Side Effects:**
- Sends notifications to all registered shoppers about the new errand
- Creates an audit log entry

### PATCH /api/errands/[id]
Update errand status. Different actions require different roles.

**Request Body (Accept Errand):**
```json
{
  "shopperId": "clx5678..."
}
```

**Request Body (Update Status):**
```json
{
  "status": "SHOPPING"
}
```

**Request Body (Approve Price):**
```json
{
  "action": "APPROVE_PRICE"
}
```

**Valid Status Transitions:**
| From Status | To Status | Required Role | Additional Data |
|-------------|-----------|---------------|-----------------|
| OPEN | ACCEPTED | Shopper | `shopperId` |
| OPEN/ACCEPTED | FUNDED | Requester | `paymentRef`, `monnifyRef` |
| ACCEPTED/FUNDED | SHOPPING | Shopper | - |
| SHOPPING | DELIVERED | Shopper | - |
| SHOPPING | PRICE_REVIEW | Shopper | - |
| PRICE_REVIEW | SHOPPING | Requester | `action: "APPROVE_PRICE"` or `"REJECT_PRICE"` |
| DELIVERED | COMPLETED | Requester | - |
| OPEN/ACCEPTED/FUNDED | CANCELLED | Requester | - |

**Response (200):**
```json
{
  "id": "clx1234...",
  "status": "ACCEPTED",
  "shopper": {
    "id": "clx5678...",
    "name": "Kemi Adeyemi",
    "estate": "Victoria Island"
  }
}
```

**Side Effects on ACCEPTED:**
- Sends notification to requester that a shopper accepted their errand

**Side Effects on COMPLETED:**
- Creates Transaction record with 10% platform fee
- Credits shopper wallet with 90% of reward
- Updates shopper's totalEarned

**Side Effects on CANCELLED (if funded):**
- Creates REFUNDED Transaction record

---

## 3. AI Assistance

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| POST | `/api/ai/suggest` | Get intelligent item suggestions based on title and market context |
| POST | `/api/ai/chat` | Interactive chat endpoint with AI shopping assistant |
| POST | `/api/ai/price-check` | Cross-market price comparison for items |
| POST | `/api/ai/fraud-check` | Risk assessment for errands and users |

### POST /api/ai/suggest
Get item suggestions based on errand title and market. Uses local rule-based engine with 40+ Nigerian market items.

**Request Body:**
```json
{
  "title": "Birthday party supplies",
  "market": "Mile 12 Market",
  "items": []
}
```

**Response (200):**
```json
{
  "suggestions": [
    { "name": "Rice (Jollof)", "quantity": "10kg", "maxBudget": 12000 },
    { "name": "Chicken", "quantity": "5kg", "maxBudget": 8000 },
    { "name": "Tomatoes", "quantity": "3 baskets", "maxBudget": 3000 },
    { "name": "Onions", "quantity": "2 bags", "maxBudget": 1500 },
    { "name": "Vegetable Oil", "quantity": "5 litres", "maxBudget": 4500 }
  ],
  "confidence": 0.95,
  "source": "pattern"
}
```

### POST /api/ai/chat
Interactive AI shopping assistant powered by Gemini 3.5 Flash with Nigerian market knowledge.

**Request Body:**
```json
{
  "message": "I need ingredients for a jollof rice party for 30 people at Mile 12 Market",
  "history": []
}
```

**Response (200):**
```json
{
  "reply": "For a jollof rice party for 30 people at Mile 12 Market, here's what you'll need...",
  "items": [
    { "name": "Rice", "quantity": "15kg", "maxBudget": 18000 },
    { "name": "Tomato Paste", "quantity": "10 sachets", "maxBudget": 2000 }
  ],
  "title": "Jollof Rice Party for 30",
  "description": "Party supplies for 30 guests"
}
```

**Features:**
- Conversation history support
- Automatic item extraction and budget calculation
- Market-specific pricing (Mile 12, Balogun, Oyingbo, etc.)
- Occasion-based suggestions (birthday, party, naming ceremony, etc.)

### POST /api/ai/price-check
Compare prices across multiple Lagos markets.

**Request Body:**
```json
{
  "items": [
    { "name": "Rice", "quantity": "10kg" }
  ]
}
```

**Response (200):**
```json
{
  "comparisons": [
    {
      "market": "Mile 12 Market",
      "total": 11500,
      "savings": 500,
      "recommendation": "Best prices for bulk purchases"
    },
    {
      "market": "Balogun Market",
      "total": 12000,
      "savings": 0,
      "recommendation": "Good for fabrics and accessories"
    }
  ],
  "bestMarket": "Mile 12 Market"
}
```

### POST /api/ai/fraud-check
Assess risk for errands and users based on 6 weighted rules.

**Request Body:**
```json
{
  "errandId": "clx1234...",
  "userId": "clx5678...",
  "amount": 150000
}
```

**Response (200):**
```json
{
  "riskScore": 25,
  "level": "low",
  "rules": [
    { "rule": "HIGH_BUDGET", "passed": true, "points": 0 },
    { "rule": "LOW_REWARD", "passed": true, "points": 0 },
    { "rule": "HIGH_VOLUME", "passed": true, "points": 0 },
    { "rule": "REPEAT_REFUND", "passed": true, "points": 0 },
    { "rule": "NEW_ACCOUNT", "passed": false, "points": 20 },
    { "rule": "ADDRESS_MISMATCH", "passed": true, "points": 0 }
  ]
}
```

**Risk Levels:**
- 0-20: LOW
- 21-60: MEDIUM
- 61-100: HIGH

---

## 4. Payments (Monnify Integration)

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| POST | `/api/monnify/init` | Initialize Monnify payment checkout session |
| POST | `/api/monnify/verify` | Verify payment transaction status with Monnify |
| POST | `/api/monnify/webhook` | Webhook receiver (SHA-512 signature verified) |

### POST /api/monnify/init
Initialize a Monnify checkout session for errand funding.

**Request Body:**
```json
{
  "amount": 50000,
  "paymentReference": "MRN-1721367000000-A1b2C3",
  "customerName": "Adebayo Ogunlesi",
  "customerEmail": "adebayo@example.com",
  "description": "Fund errand: Sunday Jollof Rice Party Supplies"
}
```

**Response (200):**
```json
{
  "checkoutUrl": "https://checkout.monnify.com/...",
  "transactionRef": "MRN-1721367000000-A1b2C3"
}
```

### POST /api/monnify/verify
Verify a payment transaction with Monnify using the v2 query endpoint.

**Request Body:**
```json
{
  "paymentReference": "MRN-1721367000000-A1b2C3"
}
```

**Response (200):**
```json
{
  "paymentReference": "MRN-1721367000000-A1b2C3",
  "paymentStatus": "PAID",
  "amountPaid": 50000,
  "transactionReference": "TST123456789",
  "paymentDate": "2026-07-19T11:00:00.000Z"
}
```

### POST /api/monnify/webhook
Monnify sends webhook notifications for payment events. Verified using SHA-512 signature.

**Webhook Payload (Monnify → MarketRun):**
```json
{
  "eventType": "SUCCESSFUL_TRANSACTION",
  "eventData": {
    "transactionReference": "TST123456789",
    "paymentReference": "MRN-1721367000000-A1b2C3",
    "amountPaid": 50000,
    "paymentStatus": "PAID",
    "customerEmail": "adebayo@example.com"
  }
}
```

**Signature Verification:**
```
SHA-512(secretKey + requestBody) == request.headers["monnify-signature"]
```

**Processing:**
1. Returns 200 immediately to Monnify
2. Verifies SHA-512 signature
3. Checks idempotency via WebhookLog
4. Updates errand status to FUNDED
5. Creates audit log entry

**Response (200):**
```json
{ "received": true }
```

---

## 5. Wallet & Financial Operations

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| GET | `/api/wallet` | Get current user wallet balance and transaction history |
| POST | `/api/wallet` | Withdraw funds (server-side Monnify payout verification) |
| POST | `/api/wallet/verify-account` | Validate bank account name & number via Monnify |
| GET | `/api/wallet/banks` | Fetch dynamic list of supported commercial banks from Monnify |

### GET /api/wallet
Get the current user's wallet balance and transaction history.

**Response (200):**
```json
{
  "wallet": {
    "balance": 45000,
    "totalEarned": 125000
  },
  "transactions": [
    {
      "id": "clx1234...",
      "errandId": "clx5678...",
      "amount": 5000,
      "platformFee": 500,
      "shopperPayout": 4500,
      "status": "PAID",
      "createdAt": "2026-07-19T15:00:00.000Z",
      "errand": {
        "title": "Sunday Jollof Rice Party Supplies"
      }
    }
  ]
}
```

### POST /api/wallet
Withdraw funds to a verified bank account via Monnify disbursement.

**Request Body:**
```json
{
  "amount": 10000,
  "bankCode": "044",
  "accountNumber": "1234567890",
  "accountName": "Adebayo Ogunlesi"
}
```

**Processing:**
1. Verifies account name via Monnify name enquiry
2. Optimistically deducts from wallet balance
3. Calls Monnify `/api/v1/merchant/transfer` for disbursement
4. On failure: rolls back wallet deduction

**Response (200):**
```json
{
  "success": true,
  "message": "Withdrawal of ₦10,000 to Adebayo Ogunlesi (044-1234567890) initiated",
  "transaction": {
    "id": "clx1234...",
    "amount": 10000,
    "status": "PROCESSING"
  }
}
```

### POST /api/wallet/verify-account
Verify a bank account name and number via Monnify name enquiry.

**Request Body:**
```json
{
  "accountNumber": "1234567890",
  "bankCode": "044"
}
```

**Response (200):**
```json
{
  "accountName": "Adebayo Ogunlesi",
  "accountNumber": "1234567890",
  "bankCode": "044",
  "bankName": "Access Bank"
}
```

### GET /api/wallet/banks
Fetch the dynamic list of supported Nigerian banks from Monnify.

**Response (200):**
```json
{
  "banks": [
    { "code": "044", "name": "Access Bank" },
    { "code": "014", "name": "Afribank" },
    { "code": "023", "name": "Citibank Nigeria" },
    { "code": "050", "name": "Ecobank Nigeria" },
    { "code": "011", "name": "First Bank of Nigeria" },
    { "code": "058", "name": "Guaranty Trust Bank" },
    { "code": "030", "name": "Heritage Bank" },
    { "code": "032", "name": "Union Bank" },
    { "code": "033", "name": "United Bank for Africa" },
    { "code": "035", "name": "Wema Bank" },
    { "code": "057", "name": "Zenith Bank" }
  ]
}
```

---

## 6. Messaging & Real-Time Communication

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| POST | `/api/messages` | Send message within an active errand conversation thread |
| GET | `/api/messages?errandId=xxx` | Retrieve complete message history for an errand |
| GET | `/api/messages/stream?errandId=xxx` | Server-Sent Events (SSE) stream for real-time messaging |

### POST /api/messages
Send a message within an errand conversation.

**Request Body:**
```json
{
  "errandId": "clx1234...",
  "content": "Hi! I'm heading to Mile 12 Market now. Need anything else?"
}
```

**Response (201):**
```json
{
  "id": "clx9012...",
  "errandId": "clx1234...",
  "senderId": "clx5678...",
  "content": "Hi! I'm heading to Mile 12 Market now. Need anything else?",
  "sender": {
    "id": "clx5678...",
    "name": "Kemi Adeyemi"
  },
  "createdAt": "2026-07-19T12:00:00.000Z"
}
```

**Side Effects:**
- Broadcasts message to all SSE subscribers of the errand
- Sends notification to the other party in the errand

### GET /api/messages?errandId=xxx
Retrieve all messages for an errand conversation.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `errandId` | string | Yes | ID of the errand |

**Response (200):**
```json
{
  "messages": [
    {
      "id": "clx9012...",
      "content": "Hi! I'm heading to Mile 12 Market now.",
      "senderId": "clx5678...",
      "sender": {
        "id": "clx5678...",
        "name": "Kemi Adeyemi"
      },
      "createdAt": "2026-07-19T12:00:00.000Z"
    },
    {
      "id": "clx9013...",
      "content": "Yes, please get extra tomatoes!",
      "senderId": "clx1234...",
      "sender": {
        "id": "clx1234...",
        "name": "Adebayo Ogunlesi"
      },
      "createdAt": "2026-07-19T12:01:00.000Z"
    }
  ]
}
```

### GET /api/messages/stream?errandId=xxx
Establish an SSE connection for real-time message updates.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `errandId` | string | Yes | ID of the errand to stream |

**SSE Events:**

Initial connection:
```
data: {"type":"connected"}
```

New message:
```
data: {"id":"clx9012...","content":"Hello!","senderId":"clx5678...","sender":{"id":"clx5678...","name":"Kemi Adeyemi"},"createdAt":"2026-07-19T12:00:00.000Z"}
```

Status change:
```
data: {"type":"STATUS_CHANGE","errandId":"clx1234...","status":"SHOPPING"}
```

Heartbeat (every 30s):
```
data: {"type":"heartbeat"}
```

---

## 7. Reviews & Ratings

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| POST | `/api/reviews` | Submit shopper review and rating post-completion |
| GET | `/api/reviews?errandId=xxx` | Get reviews associated with a specific errand |

### POST /api/reviews
Submit a review for a shopper after errand completion. One review per errand.

**Request Body:**
```json
{
  "errandId": "clx1234...",
  "rating": 5,
  "comment": "Excellent shopping! Got everything on time and even found better deals."
}
```

**Response (200):**
```json
{
  "id": "clx9012...",
  "errandId": "clx1234...",
  "reviewerId": "clx1234...",
  "revieweeId": "clx5678...",
  "rating": 5,
  "comment": "Excellent shopping! Got everything on time and even found better deals.",
  "createdAt": "2026-07-19T16:00:00.000Z"
}
```

**Validation:**
- Rating must be between 1 and 5
- Only the requester can review the shopper
- Only one review per errand

### GET /api/reviews?errandId=xxx
Get all reviews for a specific errand.

**Response (200):**
```json
{
  "reviews": [
    {
      "id": "clx9012...",
      "rating": 5,
      "comment": "Excellent shopping!",
      "reviewer": {
        "name": "Adebayo Ogunlesi"
      },
      "createdAt": "2026-07-19T16:00:00.000Z"
    }
  ]
}
```

---

## 8. KYC & Verification

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| POST | `/api/kyc` | Verify user identity / BVN verification via Monnify |

### POST /api/kyc
Verify a user's BVN (Bank Verification Number) via Monnify KYC API.

**Request Body:**
```json
{
  "bvn": "12345678901"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "BVN verified successfully",
  "kycStatus": "VERIFIED"
}
```

**Validation:**
- BVN must be exactly 11 digits

---

## 9. Reserved Accounts

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| POST | `/api/reserved-account` | Provision dedicated Monnify virtual reserved account for user |

### POST /api/reserved-account
Create a Monnify reserved (virtual) bank account for a user.

**Request Body:**
```json
{
  "bvn": "12345678901"
}
```

**Response (200):**
```json
{
  "success": true,
  "accountNumber": "1234567890",
  "bankName": "Titan Trust Bank",
  "accountReference": "MRN-ACCT-1721367000000"
}
```

---

## 10. Refunds & Disputes

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| POST | `/api/refunds` | Request refund processing for an errand |

### POST /api/refunds
Request a refund for a completed or delivered errand.

**Request Body:**
```json
{
  "errandId": "clx1234...",
  "reason": "Wrong items delivered"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Refund request submitted. You will receive ₦28,000 back to your original payment method.",
  "refundAmount": 28000
}
```

**Refund Reasons:**
- Wrong items delivered
- Items damaged
- Items not as described
- Partial delivery
- Other

---

## 11. Invoices

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| POST | `/api/invoices` | Generate dynamic payment invoice via Monnify |

### POST /api/invoices
Generate a Monnify invoice with line items for an errand.

**Request Body:**
```json
{
  "errandId": "clx1234...",
  "customerEmail": "adebayo@example.com",
  "customerName": "Adebayo Ogunlesi",
  "items": [
    { "name": "Rice (10kg)", "quantity": 1, "unitPrice": 12000 },
    { "name": "Chicken (5kg)", "quantity": 1, "unitPrice": 8000 }
  ]
}
```

**Response (200):**
```json
{
  "invoiceId": "INV-123456",
  "invoiceUrl": "https://checkout.monnify.com/invoice/...",
  "amount": 20000
}
```

---

## 12. Notifications

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| GET | `/api/notifications` | Get user notifications with unread count |
| POST | `/api/notifications` | Create a notification |
| PATCH | `/api/notifications` | Mark notifications as read |
| GET | `/api/notifications/stream` | SSE stream for real-time notifications |

### GET /api/notifications
Get the current user's notifications.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `unread` | string | false | Filter to unread only |

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "clx9012...",
      "type": "NEW_MESSAGE",
      "title": "New Message",
      "message": "Kemi sent you a message on \"Sunday Jollof Rice\"",
      "errandId": "clx1234...",
      "read": false,
      "createdAt": "2026-07-19T12:00:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

### PATCH /api/notifications
Mark notifications as read.

**Request Body (Mark specific):**
```json
{
  "ids": ["clx9012...", "clx9013..."]
}
```

**Request Body (Mark all):**
```json
{
  "markAll": true
}
```

### GET /api/notifications/stream
Establish an SSE connection for real-time notifications.

**SSE Events:**
```
data: {"type":"connected"}

data: {"type":"NOTIFICATION","notification":{"id":"clx9012...","type":"NEW_MESSAGE","title":"New Message","message":"...","errandId":"clx1234...","read":false}}

data: {"type":"heartbeat"}
```

**Notification Types:**
| Type | Trigger |
|------|---------|
| `NEW_MESSAGE` | New message received on an errand |
| `NEW_ERRAND` | New errand posted (notifies shoppers) |
| `SHOPPER_ACCEPTED` | Shopper accepted an errand (notifies requester) |

---

## 13. Administration

| Method | Endpoint Path | Description |
|--------|--------------|-------------|
| GET | `/api/admin/dashboard` | Retrieve platform metrics (total users, errands, overall revenue) |

### GET /api/admin/dashboard
Get platform-wide metrics. Requires admin role.

**Response (200):**
```json
{
  "users": {
    "total": 7,
    "requesters": 5,
    "shoppers": 2
  },
  "errands": {
    "total": 6,
    "open": 2,
    "accepted": 1,
    "funded": 1,
    "shopping": 1,
    "completed": 1
  },
  "revenue": {
    "total": 28000,
    "platformFees": 2800
  }
}
```

---

## 14. Database Models Schema

| Entity | Fields | Description |
|--------|--------|-------------|
| **User** | id, name, email, password, estate, role, walletBalance, totalEarned, reservedAccountNumber, reservedAccountBank, kycStatus, kycBvn, rating | User profile, authentication, Monnify account, KYC, and reputation |
| **Errand** | id, title, description, market, items, budget, reward, status, address, estate, requesterId, shopperId, monnifyRef, paymentRef, paymentStatus, invoiceId, invoiceUrl | Core errand entity with shopping specs, payment tracking, and Monnify integration |
| **Message** | id, errandId, senderId, content, createdAt | Real-time conversation messages linked to errands |
| **Review** | id, errandId, reviewerId, revieweeId, rating, comment | Rating and feedback left after errand completion |
| **Transaction** | id, errandId, amount, platformFee, shopperPayout, monnifyRef, status | Financial ledger for payments, fees, and payouts |
| **WebhookLog** | id, eventType, payload, signature, processed, idempotencyKey | Monnify webhook event tracking and idempotency |
| **AuditLog** | id, action, entityType, entityId, userId, details | Security audit trail for all critical operations |
| **Notification** | id, userId, type, title, message, errandId, read, createdAt | In-app notification tracking with read/unread status |

---

## 15. Errand Lifecycle & Status Flow

```
OPEN  ➜  ACCEPTED  ➜  FUNDED  ➜  SHOPPING  ➜  [PRICE_REVIEW]  ➜  DELIVERED  ➜  COMPLETED
```

| Status | Description | Trigger |
|--------|-------------|---------|
| **OPEN** | Errand published by requester, awaiting shopper acceptance | `POST /api/errands` |
| **ACCEPTED** | Shopper has accepted the errand | `PATCH /api/errands/[id]` with `shopperId` |
| **FUNDED** | Payment escrow funded by requester via Monnify | `PATCH /api/errands/[id]` with `monnifyRef` |
| **SHOPPING** | Shopper actively purchasing items at the market | `PATCH /api/errands/[id]` with `status: "SHOPPING"` |
| **PRICE_REVIEW** | (Optional) Adjustment required due to price fluctuations | `PATCH /api/errands/[id]` with `status: "PRICE_REVIEW"` |
| **DELIVERED** | Items delivered to requester address | `PATCH /api/errands/[id]` with `status: "DELIVERED"` |
| **COMPLETED** | Requester confirmed satisfaction; escrow funds released to shopper | `PATCH /api/errands/[id]` with `status: "COMPLETED"` |
| **CANCELLED** | Requester cancelled the errand | `PATCH /api/errands/[id]` with `status: "CANCELLED"` |

---

## 16. Monnify API Reference

MarketRun integrates with the following Monnify APIs:

| Monnify API | Endpoint | Usage |
|-------------|----------|-------|
| **Auth** | `POST /api/v1/auth/login` | Token generation via Basic auth |
| **Transactions** | `POST /api/v1/merchant/transactions/init-transaction` | Checkout session creation |
| **Transactions** | `GET /api/v2/merchant/transactions/query` | Payment verification |
| **Webhooks** | `POST /api/monnify/webhook` | Payment event notifications |
| **Reserved Accounts** | `POST /api/v1/reserved-accounts` | Virtual bank account creation |
| **Banks** | `GET /api/v1/banks` | Dynamic bank listing |
| **Disbursements** | `POST /api/v1/merchant/transfer` | Fund disbursement to bank accounts |
| **Account Validation** | `GET /api/v1/disbursements/account/validate` | Bank account name enquiry |
| **KYC** | `POST /api/v1/verification/verify-bvn` | BVN verification |
| **Refunds** | `POST /api/v1/refunds` | Payment refund processing |

---

## 17. Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `MONNIFY_API_KEY` | Monnify API key | Yes |
| `MONNIFY_SECRET_KEY` | Monnify secret key | Yes |
| `MONNIFY_BASE_URL` | Monnify API base URL | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `GOOGLE_EMAIL` | Gmail address for OTP emails | Yes |
| `GOOGLE_APP_PASSWORD` | Gmail app password | Yes |

---

## 18. Authentication

All protected endpoints require a JWT token in the `marketrun_token` cookie.

**Token Format:**
```
Cookie: marketrun_token=eyJhbGciOiJIUzI1NiIs...
```

**Claims:**
```json
{
  "userId": "clx1234...",
  "iat": 1721367000,
  "exp": 1721971800
}
```

**Error Response (401):**
```json
{ "error": "Unauthorized" }
```

---

## 19. Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

**HTTP Status Codes:**
| Code | Description |
|------|-------------|
| 400 | Bad Request — Invalid input or missing required fields |
| 401 | Unauthorized — No valid authentication token |
| 403 | Forbidden — Authenticated but not authorized for this action |
| 404 | Not Found — Resource does not exist |
| 500 | Internal Server Error — Unexpected server failure |

---

## 20. Rate Limiting

Currently not implemented. All endpoints are available without rate limiting.

**Recommendation:** Implement rate limiting (e.g., 100 requests/minute per IP) before production deployment.

---

## 21. Deployment

**Live URL:** https://marketrun-4icq.onrender.com

**Demo Accounts:**
| Email | Password | Role |
|-------|----------|------|
| adebayo@marketrun.com | password123 | Requester |
| kemi@marketrun.com | password123 | Shopper |
| admin@marketrun.com | password123 | Admin |

**Local Development:**
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Initialize database
npx prisma db push

# Seed demo data
npx prisma db seed

# Start development server
npm run dev
```
