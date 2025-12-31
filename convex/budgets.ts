import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const budgets = await ctx.db.query("budgets").collect();
    
    // Enrich with category info
    const enrichedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const category = await ctx.db.get(budget.categoryId);
        return {
          ...budget,
          category,
        };
      })
    );
    
    return enrichedBudgets;
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    // Enrich with category info and calculate spending
    const enrichedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const category = await ctx.db.get(budget.categoryId);
        const spent = await calculateSpending(ctx, budget);
        const remaining = budget.amount - spent;
        const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        return {
          ...budget,
          category,
          spent,
          remaining,
          percentUsed,
        };
      })
    );
    
    return enrichedBudgets;
  },
});

export const getById = query({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.id);
    if (!budget) return null;
    
    const category = await ctx.db.get(budget.categoryId);
    const spent = await calculateSpending(ctx, budget);
    const remaining = budget.amount - spent;
    const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    return {
      ...budget,
      category,
      spent,
      remaining,
      percentUsed,
    };
  },
});

export const getByCategory = query({
  args: { categoryId: v.id("categories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("budgets")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .first();
  },
});

export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    amount: v.number(),
    period: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    startDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if a budget already exists for this category
    const existing = await ctx.db
      .query("budgets")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .first();
    
    if (existing) {
      throw new Error("A budget already exists for this category");
    }
    
    return await ctx.db.insert("budgets", {
      categoryId: args.categoryId,
      amount: args.amount,
      period: args.period,
      startDate: args.startDate ?? Date.now(),
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("budgets"),
    amount: v.optional(v.number()),
    period: v.optional(
      v.union(
        v.literal("weekly"),
        v.literal("monthly"),
        v.literal("yearly")
      )
    ),
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
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggleActive = mutation({
  args: { id: v.id("budgets") },
  handler: async (ctx, args) => {
    const budget = await ctx.db.get(args.id);
    if (!budget) throw new Error("Budget not found");
    
    await ctx.db.patch(args.id, { isActive: !budget.isActive });
    return !budget.isActive;
  },
});

// Get summary of all budgets
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    let totalBudgeted = 0;
    let totalSpent = 0;
    let onTrack = 0;
    let overBudget = 0;
    
    for (const budget of budgets) {
      // Normalize to monthly for comparison
      const monthlyAmount = normalizeToMonthly(budget.amount, budget.period);
      totalBudgeted += monthlyAmount;
      
      const spent = await calculateSpending(ctx, budget);
      totalSpent += spent;
      
      if (spent <= budget.amount) {
        onTrack++;
      } else {
        overBudget++;
      }
    }
    
    return {
      totalBudgets: budgets.length,
      totalBudgeted,
      totalSpent,
      remaining: totalBudgeted - totalSpent,
      onTrack,
      overBudget,
      percentUsed: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
    };
  },
});

// Helper function to calculate spending for a budget period
async function calculateSpending(
  ctx: QueryCtx,
  budget: { categoryId: Id<"categories">; period: string; startDate: number }
) {
  const periodStart = getPeriodStart(budget.period, budget.startDate);
  
  const transactions = await ctx.db
    .query("transactions")
    .withIndex("by_category", (q) => q.eq("categoryId", budget.categoryId))
    .collect();
  
  // Filter by date and type (only expenses count against budget)
  const relevantTransactions = transactions.filter(
    (t) => t.date >= periodStart && t.type === "expense"
  );
  
  return relevantTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

// Helper to get the start of the current budget period
function getPeriodStart(period: string, budgetStartDate: number): number {
  const now = new Date();
  const startDate = new Date(budgetStartDate);
  
  switch (period) {
    case "weekly": {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Start from Monday
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      monday.setHours(0, 0, 0, 0);
      return monday.getTime();
    }
    case "monthly": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return monthStart.getTime();
    }
    case "yearly": {
      // Use the month from start date as fiscal year start
      const fiscalMonth = startDate.getMonth();
      let yearStart;
      if (now.getMonth() >= fiscalMonth) {
        yearStart = new Date(now.getFullYear(), fiscalMonth, 1);
      } else {
        yearStart = new Date(now.getFullYear() - 1, fiscalMonth, 1);
      }
      return yearStart.getTime();
    }
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }
}

// Helper to normalize budget amounts to monthly
function normalizeToMonthly(amount: number, period: string): number {
  switch (period) {
    case "weekly":
      return amount * 4.33; // Average weeks per month
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
    default:
      return amount;
  }
}
