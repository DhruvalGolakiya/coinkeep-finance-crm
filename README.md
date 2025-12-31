# CoinKeep

A modern, full-featured personal and business finance management application built with Next.js and Convex.

![CoinKeep](https://img.shields.io/badge/CoinKeep-Finance%20Manager-6366f1)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Convex](https://img.shields.io/badge/Convex-Backend-ff6b6b)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

## Features

### 💰 Account Management
- **Multiple Account Types** - Bank accounts, credit cards, cash, investments, and assets
- **Business & Personal** - Separate tracking for business and personal accounts
- **Multi-Currency Support** - Track finances in your preferred currency
- **Real-time Balances** - Automatic balance updates with every transaction
- **Net Worth Tracking** - See your total assets vs liabilities at a glance

### 📊 Transaction Tracking
- **Income & Expenses** - Track all money in and out
- **Transfers** - Move money between accounts (including credit card payments)
- **Categories** - Organize transactions with customizable categories
- **Business Expense Tagging** - Mark transactions as business expenses for tax purposes
- **Search & Filters** - Find any transaction quickly

### 💳 Credit Card Management
- **Pay Credit Card Bills** - Transfer from bank to pay off credit card debt
- **Track Balance Owed** - See how much you owe on each card
- **Automatic Balance Updates** - Payments reduce your credit card balance correctly

### 📈 Budgets
- **Category Budgets** - Set spending limits by category
- **Weekly/Monthly/Yearly** - Choose your budget period
- **Progress Tracking** - Visual progress bars show spending vs budget
- **Overspending Alerts** - Know when you're over budget

### 🎯 Financial Goals
- **Savings Goals** - Set targets for things you're saving for
- **Progress Tracking** - See how close you are to each goal
- **Visual Progress** - Beautiful progress indicators

### 🔄 Recurring Transactions
- **Automated Entries** - Set up recurring income and expenses
- **Flexible Frequency** - Daily, weekly, bi-weekly, monthly, or yearly
- **Bill Reminders** - Never miss a payment

### 👥 Client Management (for Freelancers/Agencies)
- **Client Profiles** - Store client information
- **Contact Details** - Keep emails, phones, and addresses organized
- **Project Tracking** - Link clients to invoices and transactions

### 📄 Invoicing
- **Create Invoices** - Professional invoices for your clients
- **PDF Export** - Download invoices as PDF
- **Status Tracking** - Draft, sent, paid, overdue statuses
- **Payment Tracking** - Link payments to invoices

### 📊 Reports & Analytics
- **Cash Flow Charts** - Visualize income vs expenses over time
- **Category Breakdown** - See where your money goes
- **Spending Trends** - Track spending patterns month over month
- **Business vs Personal** - Separate reports for business and personal finances
- **Income vs Expense Analysis** - Understand your financial health

### ⚙️ Customization
- **Use Case Profiles** - Personal, Freelancer, Small Business, or Agency
- **Currency Selection** - Choose from 14+ currencies worldwide
- **Date Format** - Set your preferred date format
- **Fiscal Year** - Configure your fiscal year start month
- **Dark/Light Theme** - Choose your preferred appearance

### 🚀 Onboarding
- **Guided Setup** - Step-by-step onboarding process
- **Smart Defaults** - Pre-configured accounts and categories based on your use case
- **Quick Start** - Get up and running in minutes

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Convex (real-time database)
- **Styling**: Tailwind CSS 4
- **UI Components**: Base UI, Radix UI
- **Charts**: Recharts
- **Icons**: Phosphor Icons
- **PDF Generation**: jsPDF

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- A Convex account (free at [convex.dev](https://convex.dev))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd coinkeep
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up Convex**
   
   If you haven't already, install the Convex CLI:
   ```bash
   npm install -g convex
   ```

   Login to Convex:
   ```bash
   npx convex login
   ```

   Initialize Convex for this project:
   ```bash
   npx convex dev
   ```
   
   This will:
   - Create a new Convex project (or link to an existing one)
   - Deploy the schema and functions
   - Generate the TypeScript types
   - Start watching for changes

4. **Start the development server**
   
   In a new terminal (keep `convex dev` running):
   ```bash
   npm run dev
   ```

5. **Open the app**
   
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

The Convex CLI automatically creates a `.env.local` file with your Convex deployment URL:

```env
CONVEX_DEPLOYMENT=dev:your-project-name
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

## Project Structure

```
coinkeep/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages (login, onboarding)
│   ├── (dashboard)/       # Main app pages
│   └── dashboard/         # Dashboard routes
├── components/            # React components
│   ├── accounts/          # Account-related components
│   ├── budgets/           # Budget components
│   ├── clients/           # Client management
│   ├── dashboard/         # Dashboard widgets
│   ├── goals/             # Goals components
│   ├── invoices/          # Invoice components
│   ├── layout/            # Layout components (sidebar, header)
│   ├── onboarding/        # Onboarding step components
│   ├── providers/         # Context providers
│   ├── reports/           # Report charts
│   ├── transactions/      # Transaction components
│   └── ui/                # UI primitives
├── convex/                # Convex backend
│   ├── _generated/        # Auto-generated types
│   ├── schema.ts          # Database schema
│   ├── accounts.ts        # Account functions
│   ├── transactions.ts    # Transaction functions
│   ├── budgets.ts         # Budget functions
│   ├── goals.ts           # Goals functions
│   ├── categories.ts      # Category functions
│   ├── clients.ts         # Client functions
│   ├── invoices.ts        # Invoice functions
│   ├── recurring.ts       # Recurring transaction functions
│   ├── reports.ts         # Report/analytics functions
│   ├── analytics.ts       # Analytics functions
│   └── users.ts           # User functions
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
└── public/                # Static assets
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx convex dev` | Start Convex development (watches for changes) |
| `npx convex deploy` | Deploy Convex to production |

## Deployment

### Deploy Convex Backend

```bash
npx convex deploy
```

### Deploy Frontend to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `CONVEX_DEPLOYMENT` - Your production deployment name
   - `NEXT_PUBLIC_CONVEX_URL` - Your Convex production URL
4. Deploy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

---

Built with ❤️ using Next.js and Convex
