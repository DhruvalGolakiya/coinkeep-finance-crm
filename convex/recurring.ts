import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const recurring = await ctx.db.query("recurringTransactions").collect();
    
    // Enrich with account and category info
    const enriched = await Promise.all(
      recurring.map(async (r) => {
        const account = await ctx.db.get(r.accountId);
        const category = r.categoryId ? await ctx.db.get(r.categoryId) : null;
        return {
          ...r,
          account,
          category,
        };
      })
    );
    
    return enriched;
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const recurring = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    // Sort by next due date
    recurring.sort((a, b) => a.nextDueDate - b.nextDueDate);
    
    // Enrich with account and category info
    const enriched = await Promise.all(
      recurring.map(async (r) => {
        const account = await ctx.db.get(r.accountId);
        const category = r.categoryId ? await ctx.db.get(r.categoryId) : null;
        return {
          ...r,
          account,
          category,
        };
      })
    );
    
    return enriched;
  },
});

export const getUpcoming = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const daysAhead = args.days ?? 30;
    const now = Date.now();
    const cutoff = now + (daysAhead * 24 * 60 * 60 * 1000);
    
    const recurring = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    // Filter by due date
    const upcoming = recurring.filter(r => r.nextDueDate <= cutoff);
    upcoming.sort((a, b) => a.nextDueDate - b.nextDueDate);
    
    // Enrich
    const enriched = await Promise.all(
      upcoming.map(async (r) => {
        const account = await ctx.db.get(r.accountId);
        const category = r.categoryId ? await ctx.db.get(r.categoryId) : null;
        const daysUntilDue = Math.ceil((r.nextDueDate - now) / (24 * 60 * 60 * 1000));
        return {
          ...r,
          account,
          category,
          daysUntilDue,
          isOverdue: daysUntilDue < 0,
          isDueToday: daysUntilDue === 0,
          isDueSoon: daysUntilDue > 0 && daysUntilDue <= 7,
        };
      })
    );
    
    return enriched;
  },
});

export const getById = query({
  args: { id: v.id("recurringTransactions") },
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.id);
    if (!r) return null;
    
    const account = await ctx.db.get(r.accountId);
    const category = r.categoryId ? await ctx.db.get(r.categoryId) : null;
    
    return {
      ...r,
      account,
      category,
    };
  },
});

export const create = mutation({
  args: {
    accountId: v.id("accounts"),
    type: v.union(v.literal("income"), v.literal("expense")),
    amount: v.number(),
    categoryId: v.optional(v.id("categories")),
    description: v.string(),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("biweekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    nextDueDate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recurringTransactions", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Batch create recurring transactions (for onboarding)
export const batchCreate = mutation({
  args: {
    transactions: v.array(
      v.object({
        accountId: v.id("accounts"),
        type: v.union(v.literal("income"), v.literal("expense")),
        amount: v.number(),
        categoryId: v.optional(v.id("categories")),
        description: v.string(),
        frequency: v.union(
          v.literal("daily"),
          v.literal("weekly"),
          v.literal("biweekly"),
          v.literal("monthly"),
          v.literal("yearly")
        ),
        nextDueDate: v.number(),
        notes: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const transaction of args.transactions) {
      const id = await ctx.db.insert("recurringTransactions", {
        ...transaction,
        isActive: true,
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const update = mutation({
  args: {
    id: v.id("recurringTransactions"),
    accountId: v.optional(v.id("accounts")),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    amount: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    description: v.optional(v.string()),
    frequency: v.optional(
      v.union(
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("biweekly"),
        v.literal("monthly"),
        v.literal("yearly")
      )
    ),
    nextDueDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
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
  args: { id: v.id("recurringTransactions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("recurringTransactions") },
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.id);
    if (!r) throw new Error("Recurring transaction not found");
    
    await ctx.db.patch(args.id, { isActive: !r.isActive });
    return !r.isActive;
  },
});

// Process a recurring transaction - creates an actual transaction and updates the next due date
export const processRecurring = mutation({
  args: { id: v.id("recurringTransactions") },
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.id);
    if (!r) throw new Error("Recurring transaction not found");
    
    // Create the actual transaction
    const transactionId = await ctx.db.insert("transactions", {
      accountId: r.accountId,
      type: r.type,
      amount: r.amount,
      categoryId: r.categoryId,
      description: r.description,
      date: r.nextDueDate,
      isBusinessExpense: false,
      notes: r.notes,
      recurringId: r._id,
      createdAt: Date.now(),
    });
    
    // Update account balance
    const account = await ctx.db.get(r.accountId);
    if (account) {
      const newBalance = r.type === "income"
        ? account.balance + r.amount
        : account.balance - r.amount;
      await ctx.db.patch(r.accountId, { balance: newBalance });
    }
    
    // Calculate next due date
    const nextDueDate = calculateNextDueDate(r.nextDueDate, r.frequency);
    
    await ctx.db.patch(args.id, {
      nextDueDate,
      lastProcessedDate: Date.now(),
    });
    
    return transactionId;
  },
});

// Skip a recurring transaction (don't create transaction, just move to next due date)
export const skipRecurring = mutation({
  args: { id: v.id("recurringTransactions") },
  handler: async (ctx, args) => {
    const r = await ctx.db.get(args.id);
    if (!r) throw new Error("Recurring transaction not found");
    
    const nextDueDate = calculateNextDueDate(r.nextDueDate, r.frequency);
    
    await ctx.db.patch(args.id, { nextDueDate });
    return nextDueDate;
  },
});

// Helper to calculate the next due date based on frequency
function calculateNextDueDate(currentDate: number, frequency: string): number {
  const date = new Date(currentDate);
  
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  
  return date.getTime();
}

// Get summary stats for recurring transactions
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const recurring = await ctx.db
      .query("recurringTransactions")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    const now = Date.now();
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let dueSoon = 0;
    let overdue = 0;
    
    for (const r of recurring) {
      // Normalize to monthly
      const monthlyAmount = normalizeToMonthly(r.amount, r.frequency);
      
      if (r.type === "income") {
        monthlyIncome += monthlyAmount;
      } else {
        monthlyExpenses += monthlyAmount;
      }
      
      // Check if due soon or overdue
      const daysUntilDue = Math.ceil((r.nextDueDate - now) / (24 * 60 * 60 * 1000));
      if (daysUntilDue < 0) {
        overdue++;
      } else if (daysUntilDue <= 7) {
        dueSoon++;
      }
    }
    
    return {
      total: recurring.length,
      monthlyIncome,
      monthlyExpenses,
      monthlyNet: monthlyIncome - monthlyExpenses,
      dueSoon,
      overdue,
    };
  },
});

function normalizeToMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case "daily":
      return amount * 30;
    case "weekly":
      return amount * 4.33;
    case "biweekly":
      return amount * 2.17;
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
    default:
      return amount;
  }
}
