<div align="center">

# 🏃 MarketRun

![MarketRun](https://img.shields.io/badge/Built%20for-API%20Conf%20Lagos%202026-0A6847?style=for-the-badge)
![Monnify](https://img.shields.io/badge/Payments%20by-Monnify-F59E0B?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma%206-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)

---

### *Someone is already at the market. Let them help you shop.*

**Community-powered peer-to-peer shopping for Nigerian markets — powered by Monnify.**

</div>

---

## The Problem

Nigerian open-air markets are vibrant but chaotic. Getting groceries means:

- Waking up at dawn to beat traffic
- Spending 3-4 hours navigating crowded aisles
- Carrying heavy bags back through public transport
- Expensive delivery apps that charge ₦2,000-5,000 per trip — and don't even serve informal markets

Meanwhile, hundreds of neighbors from the same estates visit these markets **every single day**, returning with unused cargo capacity. The infrastructure for community commerce exists — it just needs coordination.

## The Solution

MarketRun connects people who need groceries with community members already heading to the market. No middlemen. No delivery markup. Just neighbors helping neighbors.

**How it works:**
1. A **requester** posts an errand — what they need, which market, their budget
2. A **shopper** heading to that market accepts the job
3. **Monnify** holds the payment in escrow, splits it 90/10 on delivery confirmation
4. The requester reviews the shopper, building community trust

## Live Demo

🔗 **[marketrun-4icq.onrender.com](https://marketrun-4icq.onrender.com)**

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Requester | adebayo@marketrun.com | password123 |
| Shopper | kemi@marketrun.com | password123 |
| Admin | admin@marketrun.com | password123 |

---

## How It Works

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  1. POST    │      │  2. ACCEPT  │      │  3. DELIVER │
│             │ ───► │             │ ───► │             │
│ Requester   │      │  Shopper    │      │  Confirmed  │
│ creates     │      │  picks up   │      │  Payment    │
│ errand      │      │  the job    │      │  released   │
└─────────────┘      └─────────────┘      └─────────────┘
```

1. **Post an Errand** — Describe what you need, pick your market, set your budget and reward
2. **Shopper Accepts** — A neighbor already heading to the market picks up your errand
3. **Track & Confirm** — Real-time messaging, status timeline, and escrow-protected payment
4. **In-App Notifications** — Toast alerts for new messages, new errands, and shopper activity via real-time SSE streaming

---

## Monnify Integration

MarketRun integrates **8 Monnify APIs** to create a complete, trustless payment infrastructure:

| # | API | What It Does in MarketRun |
|---|-----|---------------------------|
| 1 | **Checkout API** | `initializeTransaction` — Funds errands via hosted payment page. Requesters pay upfront; money is held in escrow. |
| 2 | **Webhooks** | Idempotent payment confirmation with SHA-256 signature verification. Updates errand status on successful payment. |
| 3 | **Reserved Accounts** | Each user gets a personal bank account number for seamless wallet funding and balance management. |
| 4 | **Transaction Splitting** | Automatic 90/10 split on errand completion — 90% to the shopper, 10% platform fee. No manual intervention. |
| 5 | **Dynamic Invoices** | Errand line items become detailed invoices with itemized breakdowns, quantities, and subtotals. |
| 6 | **Refunds** | Full or partial refunds for dispute resolution — protects both requesters and shoppers. |
| 7 | **KYC Verification** | BVN verification ensures all shoppers are verified real people before they can accept errands. |
| 8 | **Bank Account Verification** | Name enquiry API validates bank account ownership before withdrawal processing. |

> **Architecture Note:** All payment flows are webhook-driven with full idempotency via `WebhookLog` and `AuditLog` tables. The system is resilient to duplicate deliveries and network failures.

---

## AI Features

### Smart Item Suggestions
AI-powered autocomplete that suggests common Nigerian market items as you type — from "eba" to "egusi" to "odo gwuro". Helps requesters create accurate errands faster.

### Fraud Detection
Intelligent anomaly detection that flags suspicious patterns:
- Unusually high errand amounts
- Rapid-fire errand creation
- Behavioral pattern analysis

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16, React 19 | App framework with App Router |
| Language | TypeScript | Type safety across the stack |
| Styling | Tailwind CSS 4, shadcn/ui | Utility-first CSS + component library |
| Animations | Framer Motion | Smooth transitions and micro-interactions |
| ORM | Prisma 6 | Type-safe database access |
| Database | PostgreSQL (Render) | Production relational database |
| Payments | Monnify Sandbox APIs | Escrow, splits, refunds, KYC |
| Auth | JWT (cookie-based) | Stateless authentication |
| Deployment | Render | Full-stack hosting |

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **npm** (or yarn/pnpm)
- **PostgreSQL database** (Render free tier works)
- **Monnify sandbox API keys** — get from [app.monnify.com](https://app.monnify.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/marketrun.git
cd marketrun

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database with demo data
npx prisma db seed

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/marketrun?sslmode=require

# Monnify Sandbox
MONNIFY_API_KEY=your_sandbox_api_key
MONNIFY_SECRET_KEY=your_sandbox_secret_key
MONNIFY_CONTRACT_CODE=your_contract_code
MONNIFY_BASE_URL=https://sandbox.monnify.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth (optional — has secure default)
JWT_SECRET=your_jwt_secret
```

> **Security:** Never commit real values. Use `.env` for local development and Render environment variables for production.

---

## Project Structure

```
marketrun/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page
│   │   ├── errands/
│   │   │   ├── page.tsx                # Browse errands (search, filter, paginate)
│   │   │   └── [id]/page.tsx           # Errand detail + status timeline
│   │   ├── create/page.tsx             # 4-step errand creation wizard
│   │   ├── dashboard/page.tsx          # 5-tab dashboard
│   │   ├── success/page.tsx            # Payment success + confetti
│   │   └── api/
│   │       ├── auth/                   # Login, signup, logout
│   │       ├── errands/                # Errand CRUD
│   │       ├── messages/               # Real-time messaging
│   │       ├── reviews/                # Shopper ratings
│   │       ├── wallet/                 # Balance, transactions, withdraw
│   │       └── monnify/
│   │           ├── init/route.ts       # Initialize checkout
│   │           ├── webhook/route.ts    # Payment webhooks
│   │           └── verify/route.ts     # Transaction verification
│   ├── components/
│   │   ├── landing.tsx                 # Hero, stats, features, testimonials
│   │   ├── navbar.tsx                  # Glass morphism navbar
│   │   ├── footer.tsx                  # Footer
│   │   ├── providers.tsx               # Context providers
│   │   └── ui/                         # shadcn/ui components
│   └── lib/
│       ├── auth.tsx                    # JWT auth utilities
│       ├── db.ts                       # Prisma client singleton
│       └── monnify.ts                  # Monnify API helpers
├── prisma/
│   ├── schema.prisma                   # Database schema (7 models)
│   └── seed.ts                         # Demo account seeding
└── package.json
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/errands` | List errands (paginated) |
| POST | `/api/errands` | Create new errand |
| GET | `/api/errands/[id]` | Get errand detail |
| PATCH | `/api/errands/[id]` | Update errand status |
| POST | `/api/messages` | Send message |
| GET | `/api/messages/[errandId]` | Get errand messages |
| GET | `/api/messages/stream` | SSE real-time message stream |
| POST | `/api/reviews` | Submit shopper review |
| GET | `/api/notifications` | Get user notifications |
| PATCH | `/api/notifications` | Mark notifications as read |
| GET | `/api/notifications/stream` | SSE real-time notification stream |
| GET | `/api/wallet` | Get wallet balance |
| GET | `/api/wallet/transactions` | Transaction history |
| POST | `/api/wallet/withdraw` | Request withdrawal |
| POST | `/api/monnify/init` | Initialize payment |
| POST | `/api/monnify/webhook` | Receive payment events |

---

## Database Schema

| Model | Purpose |
|-------|---------|
| **User** | User accounts with role (SHOPPER/REQUESTER), wallet balance, BVN verification status |
| **Errand** | Core entity — status, items, budget, market, requester/shopper relationships |
| **Transaction** | Payment records linked to errands with Monnify reference IDs |
| **WebhookLog** | Idempotency tracking — stores webhook event IDs to prevent duplicate processing |
| **AuditLog** | Full audit trail of all payment state changes |
| **Message** | In-app real-time messaging between requester and shopper |
| **Review** | 1-5 star ratings with comments, auto-averaged on user profile |
| **Notification** | In-app notification tracking — new messages, errand activity, shopper accepts |

---

## Design System

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#0A6847` | Trust, money, freshness |
| Secondary | `#F59E0B` | Energy, market vibes |
| Accent | `#10B981` | Success, active states |
| Background | `#FDF8F0` | Warm off-white, not sterile |

### Design Principles

- **Mobile-first** responsive design (Nigerian users are primarily mobile)
- **Glass morphism** navbar with blur effects
- **Animated status timeline** tracking errand progress
- **Confetti celebration** on successful payment
- **Nigerian UX patterns** — community validation, local market names, familiar flows

---

## Team & Submission

| Detail | Info |
|--------|------|
| **Challenge** | #APIConfXMonnify |
| **Event** | API Conference Lagos 2026 |
| **Deadline** | July 21, 2026, 12:00 PM WAT |
| **Team Size** | 2 members |
| **Live URL** | [marketrun-4icq.onrender.com](https://marketrun-4icq.onrender.com) |

---

## License

MIT

---

<div align="center">

Built with ❤️ for API Conference Lagos 2026

</div>
