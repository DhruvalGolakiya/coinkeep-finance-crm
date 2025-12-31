import { v } from "convex/values";
import { query } from "./_generated/server";

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("accounts").collect();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    // Calculate net worth and pending liabilities
    let assets = 0;
    let liabilities = 0;
    let pendingCCBalance = 0;
    for (const account of accounts) {
      if (account.type === "credit_card") {
        const ccDebt = Math.abs(account.balance);
        liabilities += ccDebt;
        pendingCCBalance += ccDebt;
      } else {
        assets += account.balance;
      }
    }

    // Get monthly transactions
    const transactions = await ctx.db
      .query("transactions")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startOfMonth),
          q.lte(q.field("date"), endOfMonth)
        )
      )
      .collect();

    // Create a map of liability account IDs (loans and credit cards)
    const liabilityAccountIds = new Set(
      accounts
        .filter((a) => a.type === "credit_card")
        .map((a) => a._id)
    );

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    for (const t of transactions) {
      // Skip transfers involving liability accounts - they're debt payments, not real income/expenses
      // But count regular income/expense on liability accounts (CC purchases ARE real expenses)
      if (t.type === "transfer") {
        if (liabilityAccountIds.has(t.accountId) || (t.toAccountId && liabilityAccountIds.has(t.toAccountId))) {
          continue;
        }
      }
      
      if (t.type === "income") monthlyIncome += t.amount;
      else if (t.type === "expense") monthlyExpenses += t.amount;
    }

    // Get pending invoices
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "sent"))
      .collect();
    const overdueInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", "overdue"))
      .collect();

    const pendingInvoiceAmount = [...invoices, ...overdueInvoices].reduce(
      (sum, inv) => sum + inv.total,
      0
    );

    const monthlySavings = monthlyIncome - monthlyExpenses;
    
    return {
      netWorth: assets - liabilities,
      assets,
      liabilities,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      // Pending CC balance (informational only - already reflected in expenses)
      pendingCCBalance,
      pendingInvoices: invoices.length + overdueInvoices.length,
      pendingInvoiceAmount,
      totalAccounts: accounts.length,
    };
  },
});

export const getMonthlyTrends = query({
  args: {
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const monthsToFetch = args.months ?? 6;
    const now = new Date();
    const trends = [];

    // Get all accounts to identify liability accounts
    const accounts = await ctx.db.query("accounts").collect();
    const liabilityAccountIds = new Set(
      accounts
        .filter((a) => a.type === "credit_card")
        .map((a) => a._id)
    );

    for (let i = monthsToFetch - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = date.getTime();
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).getTime();

      const transactions = await ctx.db
        .query("transactions")
        .filter((q) =>
          q.and(
            q.gte(q.field("date"), startOfMonth),
            q.lte(q.field("date"), endOfMonth)
          )
        )
        .collect();

      let income = 0;
      let expenses = 0;
      for (const t of transactions) {
        // Skip transfers involving liability accounts - they're debt payments
        // But count regular income/expense on liability accounts (CC purchases ARE real expenses)
        if (t.type === "transfer") {
          if (liabilityAccountIds.has(t.accountId) || (t.toAccountId && liabilityAccountIds.has(t.toAccountId))) {
            continue;
          }
        }
        
        if (t.type === "income") income += t.amount;
        else if (t.type === "expense") expenses += t.amount;
      }

      trends.push({
        month: date.toLocaleString("default", { month: "short" }),
        year: date.getFullYear(),
        income,
        expenses,
        net: income - expenses,
      });
    }

    return trends;
  },
});

export const getCategoryBreakdown = query({
  args: {
    type: v.union(v.literal("income"), v.literal("expense")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfMonth = args.startDate ?? new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = args.endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    // Get liability accounts to exclude
    const accounts = await ctx.db.query("accounts").collect();
    const liabilityAccountIds = new Set(
      accounts
        .filter((a) => a.type === "credit_card")
        .map((a) => a._id)
    );

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startOfMonth),
          q.lte(q.field("date"), endOfMonth)
        )
      )
      .collect();

    const categoryTotals: Record<string, { amount: number; name: string; color: string }> = {};

    for (const t of transactions) {
      // Note: getCategoryBreakdown only queries income/expense types (not transfers)
      // So we include all transactions including those on liability accounts
      // CC purchases ARE real expenses that should appear in category breakdown
      
      if (t.categoryId) {
        const category = await ctx.db.get(t.categoryId);
        if (category) {
          const key = category._id;
          if (!categoryTotals[key]) {
            categoryTotals[key] = { amount: 0, name: category.name, color: category.color };
          }
          categoryTotals[key].amount += t.amount;
        }
      } else {
        if (!categoryTotals["uncategorized"]) {
          categoryTotals["uncategorized"] = { amount: 0, name: "Uncategorized", color: "#9ca3af" };
        }
        categoryTotals["uncategorized"].amount += t.amount;
      }
    }

    return Object.entries(categoryTotals)
      .map(([id, data]) => ({
        id,
        ...data,
      }))
      .sort((a, b) => b.amount - a.amount);
  },
});

export const getRecentTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const transactions = await ctx.db
      .query("transactions")
      .order("desc")
      .take(limit);

    const enriched = await Promise.all(
      transactions.map(async (t) => {
        const account = await ctx.db.get(t.accountId);
        const category = t.categoryId ? await ctx.db.get(t.categoryId) : null;
        return { ...t, account, category };
      })
    );

    return enriched;
  },
});

export const getBusinessVsPersonal = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfMonth = args.startDate ?? new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const endOfMonth = args.endDate ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

    // Get liability accounts to exclude
    const accounts = await ctx.db.query("accounts").collect();
    const liabilityAccountIds = new Set(
      accounts
        .filter((a) => a.type === "credit_card")
        .map((a) => a._id)
    );

    const transactions = await ctx.db
      .query("transactions")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startOfMonth),
          q.lte(q.field("date"), endOfMonth)
        )
      )
      .collect();

    let businessIncome = 0;
    let businessExpenses = 0;
    let personalIncome = 0;
    let personalExpenses = 0;

    for (const t of transactions) {
      // Skip transfers involving liability accounts - they're debt payments
      // But count regular income/expense on liability accounts (CC purchases ARE real expenses)
      if (t.type === "transfer") {
        if (liabilityAccountIds.has(t.accountId) || (t.toAccountId && liabilityAccountIds.has(t.toAccountId))) {
          continue;
        }
      }
      
      if (t.isBusinessExpense) {
        if (t.type === "income") businessIncome += t.amount;
        else if (t.type === "expense") businessExpenses += t.amount;
      } else {
        if (t.type === "income") personalIncome += t.amount;
        else if (t.type === "expense") personalExpenses += t.amount;
      }
    }

    return {
      business: {
        income: businessIncome,
        expenses: businessExpenses,
        net: businessIncome - businessExpenses,
      },
      personal: {
        income: personalIncome,
        expenses: personalExpenses,
        net: personalIncome - personalExpenses,
      },
    };
  },
});

