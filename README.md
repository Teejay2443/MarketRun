# MarketRun

> "Someone is already at the market. Let them help you shop."

A community-powered peer-to-peer shopping platform built for API Conference Lagos 2026 Developer Challenge.

![MarketRun](https://img.shields.io/badge/Built%20for-API%20Conf%20Lagos%202026-0A6847?style=for-the-badge)
![Monnify](https://img.shields.io/badge/Payments%20by-Monnify-F59E0B?style=for-the-badge)

## The Problem

Open-air markets in Nigeria are chaotic, time-consuming, and physically demanding. Standard delivery apps are expensive and rarely service informal local markets. Yet hundreds of people from the same estates visit these markets daily, returning with unused cargo capacity.

## The Solution

MarketRun connects neighbors who need groceries with community members already heading to the market. A requester posts an errand, a shopper accepts it, Monnify holds the money in escrow, and funds are released only when the requester confirms delivery.

## How It Works

1. **Post an Errand** - Tell us what you need from the market, set your budget, and name your reward
2. **Shopper Accepts** - A neighbor already heading to the market accepts your errand
3. **Track & Receive** - Watch your shopper in real-time, confirm delivery when items arrive

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Animations | Framer Motion |
| Payments | Monnify API (Checkout, Transaction Splitting, Webhooks) |
| Database | SQLite (Prisma ORM - ready for PostgreSQL) |

## Monnify Integration

This project uses 4 Monnify APIs:

- **Checkout API** - Hosted payment page for secure transactions
- **Transaction Splitting** - Automatic 90/10 split (shopper/platform)
- **Verify Transaction** - Server-side payment verification
- **Webhooks** - Real-time payment notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Monnify sandbox API keys (get from [app.monnify.com](https://app.monnify.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/marketrun.git
cd marketrun

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Monnify sandbox keys

# Run development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="file:./dev.db"
MONNIFY_API_KEY=your_sandbox_api_key
MONNIFY_SECRET_KEY=your_sandbox_secret_key
MONNIFY_CONTRACT_CODE=your_contract_code
MONNIFY_BASE_URL=https://sandbox.monnify.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Testing Payments

Use the [Monnify Payment Simulator](https://websim.sdk.monnify.com/) to test payments in sandbox mode.

## Project Structure

```
marketrun/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── errands/
│   │   │   ├── page.tsx          # Browse errands
│   │   │   └── [id]/page.tsx     # Errand detail
│   │   ├── create/page.tsx       # Post errand
│   │   ├── dashboard/page.tsx    # User dashboard
│   │   ├── success/page.tsx      # Payment success
│   │   └── api/
│   │       └── monnify/
│   │           ├── init/route.ts     # Initialize payment
│   │           ├── verify/route.ts   # Verify transaction
│   │           └── webhook/route.ts  # Handle webhooks
│   ├── components/
│   │   ├── navbar.tsx
│   │   ├── footer.tsx
│   │   ├── landing.tsx
│   │   └── ui/                   # shadcn/ui components
│   └── lib/
│       ├── utils.ts
│       ├── monnify.ts
│       └── data.ts               # Mock data
├── prisma/
│   └── schema.prisma
└── package.json
```

## Design System

### Colors

- **Primary**: Deep Forest Green (#0A6847) - Trust, money, freshness
- **Secondary**: Warm Amber (#F59E0B) - Energy, market vibes
- **Accent**: Bright Emerald (#10B981) - Success, active states
- **Background**: Off-White Cream (#FDF8F0) - Warm, not sterile

### Key Features

- Mobile-first responsive design
- Animated status timeline
- Confetti celebration on successful payment
- Nigerian UX patterns (community validation, local touches)
- Glass morphism navbar

## Submission

- **Team**: 2 members
- **Deadline**: July 21, 2026, 12pm WAT
- **Challenge**: #APIConfXMonnify

## License

MIT

---

Built with ❤️ for API Conference Lagos 2026
