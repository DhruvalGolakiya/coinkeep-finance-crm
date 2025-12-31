import { v } from "convex/values";
import { query } from "./_generated/server";

// Get transactions for a custom date range
export const getTransactionReport = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  },
  handler: async (ctx, args) => {
    let transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date")
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();
    
    if (args.type) {
      transactions = transactions.filter(t => t.type === args.type);
    }
    
    // Enrich with category and account info
    const enriched = await Promise.all(
      transactions.map(async (t) => {
        const category = t.categoryId ? await ctx.db.get(t.categoryId) : null;
        const account = await ctx.db.get(t.accountId);
        return {
          ...t,
          categoryName: category?.name ?? "Uncategorized",
          categoryColor: category?.color ?? "#6b7280",
          accountName: account?.name ?? "Unknown",
        };
      })
    );
    
    return enriched.sort((a, b) => b.date - a.date);
  },
});

// Get summary by category for date range
export const getCategorySummary = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    type: v.union(v.literal("income"), v.literal("expense")),
  },
  handler: async (ctx, args) => {
    // Query only income/expense transactions (not transfers)
    // CC purchases ARE real expenses, so we include liability account transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date")
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate),
          q.eq(q.field("type"), args.type)
        )
      )
      .collect();
    
    // Group by category
    const categoryMap = new Map<string, { name: string; color: string; amount: number; count: number }>();
    
    for (const t of transactions) {
      const category = t.categoryId ? await ctx.db.get(t.categoryId) : null;
      const key = category?._id ?? "uncategorized";
      const existing = categoryMap.get(key);
      
      if (existing) {
        existing.amount += t.amount;
        existing.count += 1;
      } else {
        categoryMap.set(key, {
          name: category?.name ?? "Uncategorized",
          color: category?.color ?? "#6b7280",
          amount: t.amount,
          count: 1,
        });
      }
    }
    
    const results = Array.from(categoryMap.values());
    results.sort((a, b) => b.amount - a.amount);
    
    const total = results.reduce((sum, c) => sum + c.amount, 0);
    
    return {
      categories: results.map(c => ({
        ...c,
        percentage: total > 0 ? (c.amount / total) * 100 : 0,
      })),
      total,
      count: transactions.length,
    };
  },
});

// Get budget vs actual comparison
export const getBudgetVsActual = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get active budgets
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    
    // Get expenses in date range
    // CC purchases ARE real expenses, so we include liability account transactions
    const expenses = await ctx.db
      .query("transactions")
      .withIndex("by_date")
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate),
          q.eq(q.field("type"), "expense")
        )
      )
      .collect();
    
    // Calculate spending by category
    const spendingByCategory = new Map<string, number>();
    for (const e of expenses) {
      if (e.categoryId) {
        const current = spendingByCategory.get(e.categoryId) ?? 0;
        spendingByCategory.set(e.categoryId, current + e.amount);
      }
    }
    
    // Build comparison
    const comparisons = await Promise.all(
      budgets.map(async (budget) => {
        const category = await ctx.db.get(budget.categoryId);
        const actual = spendingByCategory.get(budget.categoryId) ?? 0;
        const budgetAmount = budget.amount;
        const difference = budgetAmount - actual;
        const percentUsed = budgetAmount > 0 ? (actual / budgetAmount) * 100 : 0;
        
        return {
          categoryId: budget.categoryId,
          categoryName: category?.name ?? "Unknown",
          categoryColor: category?.color ?? "#6b7280",
          budgeted: budgetAmount,
          actual,
          difference,
          percentUsed,
          status: percentUsed > 100 ? "over" : percentUsed > 80 ? "warning" : "good",
        };
      })
    );
    
    comparisons.sort((a, b) => b.percentUsed - a.percentUsed);
    
    const totalBudgeted = comparisons.reduce((sum, c) => sum + c.budgeted, 0);
    const totalActual = comparisons.reduce((sum, c) => sum + c.actual, 0);
    
    return {
      comparisons,
      totalBudgeted,
      totalActual,
      totalDifference: totalBudgeted - totalActual,
      overBudgetCount: comparisons.filter(c => c.status === "over").length,
      warningCount: comparisons.filter(c => c.status === "warning").length,
    };
  },
});

// Get financial health insights
export const getFinancialHealth = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
    
    // Get last 30 days transactions
    const recentTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_date")
      .filter((q) => q.gte(q.field("date"), thirtyDaysAgo))
      .collect();
    
    // Get previous 30 days (30-60 days ago)
    const previousTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_date")
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), sixtyDaysAgo),
          q.lt(q.field("date"), thirtyDaysAgo)
        )
      )
      .collect();
    
    // Get liability accounts for transfer exclusion
    const accounts = await ctx.db.query("accounts").collect();
    const liabilityAccountIds = new Set(
      accounts
        .filter((a) => a.type === "credit_card")
        .map((a) => a._id)
    );
    
    // Helper to check if a transaction should be counted
    // Skip transfers involving liability accounts (debt payments)
    // But count income/expense on liability accounts (CC purchases ARE real expenses)
    const shouldCount = (t: typeof recentTransactions[0]) => {
      if (t.type === "transfer") {
        return !(liabilityAccountIds.has(t.accountId) || (t.toAccountId && liabilityAccountIds.has(t.toAccountId)));
      }
      return true;
    };
    
    // Calculate metrics
    const recentIncome = recentTransactions.filter(t => t.type === "income" && shouldCount(t)).reduce((sum, t) => sum + t.amount, 0);
    const recentExpenses = recentTransactions.filter(t => t.type === "expense" && shouldCount(t)).reduce((sum, t) => sum + t.amount, 0);
    const previousIncome = previousTransactions.filter(t => t.type === "income" && shouldCount(t)).reduce((sum, t) => sum + t.amount, 0);
    const previousExpenses = previousTransactions.filter(t => t.type === "expense" && shouldCount(t)).reduce((sum, t) => sum + t.amount, 0);
    
    const savingsRate = recentIncome > 0 ? ((recentIncome - recentExpenses) / recentIncome) * 100 : 0;
    const previousSavingsRate = previousIncome > 0 ? ((previousIncome - previousExpenses) / previousIncome) * 100 : 0;
    
    // Calculate accounts total (reusing accounts from above)
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    
    // Get active budgets and their status
    const budgets = await ctx.db.query("budgets").withIndex("by_active", (q) => q.eq("isActive", true)).collect();
    
    // Get goals progress
    const goals = await ctx.db.query("goals").withIndex("by_completed", (q) => q.eq("isCompleted", false)).collect();
    const goalsProgress = goals.length > 0
      ? goals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) / goals.length
      : 0;
    
    // Calculate health score (0-100)
    let healthScore = 50; // Base score
    
    // Savings rate impact (+/- 20 points)
    if (savingsRate >= 20) healthScore += 20;
    else if (savingsRate >= 10) healthScore += 10;
    else if (savingsRate >= 0) healthScore += 5;
    else healthScore -= 10;
    
    // Positive balance (+10 points)
    if (totalBalance > 0) healthScore += 10;
    else healthScore -= 20;
    
    // Budget adherence (+10 points)
    if (budgets.length > 0) healthScore += 5;
    
    // Goals progress (+10 points)
    if (goals.length > 0 && goalsProgress > 50) healthScore += 10;
    else if (goals.length > 0) healthScore += 5;
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Generate insights
    const insights: Array<{ type: "success" | "warning" | "info"; message: string }> = [];
    
    if (savingsRate >= 20) {
      insights.push({ type: "success", message: `Great savings rate of ${savingsRate.toFixed(0)}%! You're saving more than the recommended 20%.` });
    } else if (savingsRate >= 0) {
      insights.push({ type: "info", message: `Your savings rate is ${savingsRate.toFixed(0)}%. Aim for 20% or more.` });
    } else {
      insights.push({ type: "warning", message: `You're spending more than you earn. Consider cutting expenses.` });
    }
    
    if (previousExpenses > 0 && recentExpenses > previousExpenses * 1.2) {
      insights.push({ type: "warning", message: `Expenses increased ${((recentExpenses / previousExpenses - 1) * 100).toFixed(0)}% compared to last month.` });
    } else if (previousExpenses > 0 && recentExpenses < previousExpenses * 0.8) {
      insights.push({ type: "success", message: `Expenses decreased ${((1 - recentExpenses / previousExpenses) * 100).toFixed(0)}% compared to last month.` });
    } else if (previousExpenses === 0 && recentExpenses > 0) {
      insights.push({ type: "info", message: `You've started tracking expenses this month (${recentExpenses > 0 ? "first month" : "no data"}).` });
    }
    
    if (goals.length > 0) {
      const avgProgress = goalsProgress;
      insights.push({ type: "info", message: `You have ${goals.length} active goal${goals.length > 1 ? "s" : ""} with ${avgProgress.toFixed(0)}% average progress.` });
    }
    
    return {
      healthScore,
      savingsRate,
      previousSavingsRate,
      savingsRateChange: savingsRate - previousSavingsRate,
      totalBalance,
      recentIncome,
      recentExpenses,
      netCashFlow: recentIncome - recentExpenses,
      incomeChange: previousIncome > 0 ? ((recentIncome / previousIncome) - 1) * 100 : 0,
      expenseChange: previousExpenses > 0 ? ((recentExpenses / previousExpenses) - 1) * 100 : 0,
      insights,
      activeGoals: goals.length,
      activeBudgets: budgets.length,
    };
  },
});

// Get tax report summary (for freelancers/business)
export const getTaxSummary = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    // Get liability accounts for transfer exclusion
    const accounts = await ctx.db.query("accounts").collect();
    const liabilityAccountIds = new Set(
      accounts
        .filter((a) => a.type === "credit_card")
        .map((a) => a._id)
    );

    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_date")
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();
    
    // Skip transfers involving liability accounts (debt payments)
    // But count income/expense on liability accounts (CC purchases ARE real expenses)
    const transactions = allTransactions.filter(t => {
      if (t.type === "transfer") {
        return !(liabilityAccountIds.has(t.accountId) || (t.toAccountId && liabilityAccountIds.has(t.toAccountId)));
      }
      return true;
    });
    
    const income = transactions.filter(t => t.type === "income");
    const expenses = transactions.filter(t => t.type === "expense");
    
    // Group income by category
    const incomeByCategory = new Map<string, { name: string; amount: number; count: number }>();
    for (const t of income) {
      const category = t.categoryId ? await ctx.db.get(t.categoryId) : null;
      const key = category?._id ?? "uncategorized";
      const existing = incomeByCategory.get(key);
      if (existing) {
        existing.amount += t.amount;
        existing.count += 1;
      } else {
        incomeByCategory.set(key, {
          name: category?.name ?? "Uncategorized",
          amount: t.amount,
          count: 1,
        });
      }
    }
    
    // Group expenses by category (potential deductions)
    const expenseByCategory = new Map<string, { name: string; amount: number; count: number }>();
    for (const t of expenses) {
      const category = t.categoryId ? await ctx.db.get(t.categoryId) : null;
      const key = category?._id ?? "uncategorized";
      const existing = expenseByCategory.get(key);
      if (existing) {
        existing.amount += t.amount;
        existing.count += 1;
      } else {
        expenseByCategory.set(key, {
          name: category?.name ?? "Uncategorized",
          amount: t.amount,
          count: 1,
        });
      }
    }
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      incomeByCategory: Array.from(incomeByCategory.values()).sort((a, b) => b.amount - a.amount),
      expenseByCategory: Array.from(expenseByCategory.values()).sort((a, b) => b.amount - a.amount),
      transactionCount: transactions.length,
      incomeCount: income.length,
      expenseCount: expenses.length,
    };
  },
});

// Get data for CSV export
export const getExportData = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
  },
  handler: async (ctx, args) => {
    let transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date")
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();
    
    if (args.type) {
      transactions = transactions.filter(t => t.type === args.type);
    }
    
    // Enrich and format for export
    const exportData = await Promise.all(
      transactions.map(async (t) => {
        const category = t.categoryId ? await ctx.db.get(t.categoryId) : null;
        const account = await ctx.db.get(t.accountId);
        
        return {
          Date: new Date(t.date).toISOString().split("T")[0],
          Type: t.type,
          Description: t.description,
          Amount: t.amount,
          Category: category?.name ?? "Uncategorized",
          Account: account?.name ?? "Unknown",
          Notes: t.notes ?? "",
        };
      })
    );
    
    return exportData.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime());
  },
});
