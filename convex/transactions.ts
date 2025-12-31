import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("transactions").order("desc");
    
    const transactions = args.limit 
      ? await query.take(args.limit)
      : await query.collect();

    // Enrich with account and category info
    const enriched = await Promise.all(
      transactions.map(async (t) => {
        const account = await ctx.db.get(t.accountId);
        const category = t.categoryId ? await ctx.db.get(t.categoryId) : null;
        const toAccount = t.toAccountId ? await ctx.db.get(t.toAccountId) : null;
        return { ...t, account, category, toAccount };
      })
    );

    return enriched;
  },
});

export const getByAccount = query({
  args: { accountId: v.id("accounts") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .order("desc")
      .collect();

    const enriched = await Promise.all(
      transactions.map(async (t) => {
        const category = t.categoryId ? await ctx.db.get(t.categoryId) : null;
        return { ...t, category };
      })
    );

    return enriched;
  },
});

export const getByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

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

export const create = mutation({
  args: {
    accountId: v.id("accounts"),
    type: v.union(
      v.literal("income"),
      v.literal("expense"),
      v.literal("transfer")
    ),
    amount: v.number(),
    categoryId: v.optional(v.id("categories")),
    description: v.string(),
    date: v.number(),
    isBusinessExpense: v.boolean(),
    invoiceId: v.optional(v.id("invoices")),
    toAccountId: v.optional(v.id("accounts")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Create the transaction
    const transactionId = await ctx.db.insert("transactions", {
      ...args,
      createdAt: Date.now(),
    });

    // Update account balance
    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    if (args.type === "income") {
      await ctx.db.patch(args.accountId, {
        balance: account.balance + args.amount,
      });
    } else if (args.type === "expense") {
      const isLiability = account.type === "credit_card";
      await ctx.db.patch(args.accountId, {
        balance: isLiability
          ? account.balance + args.amount  // CC: expense increases debt (positive = owed)
          : account.balance - args.amount, // Normal: deduct from bank/cash
      });
    } else if (args.type === "transfer" && args.toAccountId) {
      const toAccount = await ctx.db.get(args.toAccountId);
      if (!toAccount) throw new Error("Destination account not found");
      
      const isDestLiability = toAccount.type === "credit_card";
      
      // Source account: always deduct (bank/cash paying off a CC)
      await ctx.db.patch(args.accountId, {
        balance: account.balance - args.amount,
      });
      
      // Destination: if CC, subtract to reduce debt; else add
      await ctx.db.patch(args.toAccountId, {
        balance: isDestLiability
          ? toAccount.balance - args.amount  // Paying CC: 500 - 100 = 400 owed
          : toAccount.balance + args.amount, // Normal: add to bank/cash
      });
    }

    return transactionId;
  },
});

export const update = mutation({
  args: {
    id: v.id("transactions"),
    description: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    isBusinessExpense: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.id);
    if (!transaction) throw new Error("Transaction not found");

    // Reverse the balance change
    const account = await ctx.db.get(transaction.accountId);
    if (account) {
      if (transaction.type === "income") {
        await ctx.db.patch(transaction.accountId, {
          balance: account.balance - transaction.amount,
        });
      } else if (transaction.type === "expense") {
        const isLiability = account.type === "credit_card";
        await ctx.db.patch(transaction.accountId, {
          balance: isLiability
            ? account.balance - transaction.amount  // Reverse CC expense: reduce debt
            : account.balance + transaction.amount, // Reverse normal: add back
        });
      } else if (transaction.type === "transfer" && transaction.toAccountId) {
        const toAccount = await ctx.db.get(transaction.toAccountId);
        
        const isDestLiability = toAccount?.type === "credit_card";
        
        // Reverse source: add back what was deducted
        await ctx.db.patch(transaction.accountId, {
          balance: account.balance + transaction.amount,
        });
        
        // Reverse destination: undo what was done
        if (toAccount) {
          await ctx.db.patch(transaction.toAccountId, {
            balance: isDestLiability
              ? toAccount.balance + transaction.amount  // Reverse CC payment: restore debt
              : toAccount.balance - transaction.amount, // Reverse normal: deduct
          });
        }
      }
    }

    await ctx.db.delete(args.id);
  },
});

export const getMonthlyTotals = query({
  args: {
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const startDate = new Date(args.year, args.month - 1, 1).getTime();
    const endDate = new Date(args.year, args.month, 0, 23, 59, 59).getTime();

    // Get credit card accounts for transfer exclusion logic
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
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();

    let income = 0;
    let expenses = 0;

    for (const t of transactions) {
      // Skip transfers involving liability accounts - they're debt payments, not real income/expenses
      // But count regular income/expense on liability accounts (CC purchases ARE real expenses)
      if (t.type === "transfer") {
        // Skip transfers to/from liability accounts (debt payments)
        if (liabilityAccountIds.has(t.accountId) || (t.toAccountId && liabilityAccountIds.has(t.toAccountId))) {
          continue;
        }
      }
      
      if (t.type === "income") {
        income += t.amount;
      } else if (t.type === "expense") {
        expenses += t.amount;
      }
    }

    return {
      income,
      expenses,
      net: income - expenses,
      count: transactions.length,
    };
  },
});

