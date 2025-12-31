import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const goals = await ctx.db.query("goals").collect();
    
    // Enrich with linked account info
    const enriched = await Promise.all(
      goals.map(async (goal) => {
        const linkedAccount = goal.linkedAccountId 
          ? await ctx.db.get(goal.linkedAccountId) 
          : null;
        
        const percentComplete = goal.targetAmount > 0 
          ? (goal.currentAmount / goal.targetAmount) * 100 
          : 0;
        
        const remaining = goal.targetAmount - goal.currentAmount;
        
        // Calculate days until target date
        let daysRemaining = null;
        let isOverdue = false;
        if (goal.targetDate) {
          const now = Date.now();
          daysRemaining = Math.ceil((goal.targetDate - now) / (24 * 60 * 60 * 1000));
          isOverdue = daysRemaining < 0 && !goal.isCompleted;
        }
        
        return {
          ...goal,
          linkedAccount,
          percentComplete,
          remaining,
          daysRemaining,
          isOverdue,
        };
      })
    );
    
    // Sort: incomplete first, then by target date
    enriched.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      if (a.targetDate && b.targetDate) {
        return a.targetDate - b.targetDate;
      }
      return 0;
    });
    
    return enriched;
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_completed", (q) => q.eq("isCompleted", false))
      .collect();
    
    const enriched = await Promise.all(
      goals.map(async (goal) => {
        const linkedAccount = goal.linkedAccountId 
          ? await ctx.db.get(goal.linkedAccountId) 
          : null;
        
        const percentComplete = goal.targetAmount > 0 
          ? (goal.currentAmount / goal.targetAmount) * 100 
          : 0;
        
        const remaining = goal.targetAmount - goal.currentAmount;
        
        let daysRemaining = null;
        let isOverdue = false;
        let monthlyNeeded = null;
        
        if (goal.targetDate) {
          const now = Date.now();
          daysRemaining = Math.ceil((goal.targetDate - now) / (24 * 60 * 60 * 1000));
          isOverdue = daysRemaining < 0;
          
          // Calculate monthly contribution needed
          if (daysRemaining > 0 && remaining > 0) {
            const monthsRemaining = daysRemaining / 30;
            monthlyNeeded = remaining / monthsRemaining;
          }
        }
        
        return {
          ...goal,
          linkedAccount,
          percentComplete,
          remaining,
          daysRemaining,
          isOverdue,
          monthlyNeeded,
        };
      })
    );
    
    enriched.sort((a, b) => {
      if (a.targetDate && b.targetDate) {
        return a.targetDate - b.targetDate;
      }
      return 0;
    });
    
    return enriched;
  },
});

export const getById = query({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) return null;
    
    const linkedAccount = goal.linkedAccountId 
      ? await ctx.db.get(goal.linkedAccountId) 
      : null;
    
    const percentComplete = goal.targetAmount > 0 
      ? (goal.currentAmount / goal.targetAmount) * 100 
      : 0;
    
    return {
      ...goal,
      linkedAccount,
      percentComplete,
      remaining: goal.targetAmount - goal.currentAmount,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    linkedAccountId: v.optional(v.id("accounts")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("goals", {
      name: args.name,
      targetAmount: args.targetAmount,
      currentAmount: args.currentAmount ?? 0,
      targetDate: args.targetDate,
      linkedAccountId: args.linkedAccountId,
      icon: args.icon ?? "Target",
      color: args.color ?? "#6366f1",
      isCompleted: false,
      createdAt: Date.now(),
    });
  },
});

// Batch create goals (for onboarding)
export const batchCreate = mutation({
  args: {
    goals: v.array(
      v.object({
        name: v.string(),
        targetAmount: v.number(),
        currentAmount: v.optional(v.number()),
        targetDate: v.optional(v.number()),
        icon: v.optional(v.string()),
        color: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const goal of args.goals) {
      const id = await ctx.db.insert("goals", {
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount ?? 0,
        targetDate: goal.targetDate,
        icon: goal.icon ?? "Target",
        color: goal.color ?? "#6366f1",
        isCompleted: false,
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const update = mutation({
  args: {
    id: v.id("goals"),
    name: v.optional(v.string()),
    targetAmount: v.optional(v.number()),
    currentAmount: v.optional(v.number()),
    targetDate: v.optional(v.number()),
    linkedAccountId: v.optional(v.id("accounts")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    
    // Check if goal is now complete
    const goal = await ctx.db.get(id);
    if (goal && updates.currentAmount !== undefined) {
      const isNowComplete = updates.currentAmount >= (updates.targetAmount ?? goal.targetAmount);
      if (isNowComplete && !goal.isCompleted) {
        Object.assign(filtered, { isCompleted: true });
      }
    }
    
    await ctx.db.patch(id, filtered);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const addContribution = mutation({
  args: {
    id: v.id("goals"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) throw new Error("Goal not found");
    
    const newAmount = goal.currentAmount + args.amount;
    const isNowComplete = newAmount >= goal.targetAmount;
    
    await ctx.db.patch(args.id, {
      currentAmount: newAmount,
      isCompleted: isNowComplete,
    });
    
    return { newAmount, isCompleted: isNowComplete };
  },
});

export const markComplete = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.id);
    if (!goal) throw new Error("Goal not found");
    
    await ctx.db.patch(args.id, { 
      isCompleted: true,
      currentAmount: goal.targetAmount,
    });
  },
});

export const reopenGoal = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isCompleted: false });
  },
});

// Get summary of all goals
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    const goals = await ctx.db.query("goals").collect();
    
    let totalTarget = 0;
    let totalSaved = 0;
    let activeGoals = 0;
    let completedGoals = 0;
    
    for (const goal of goals) {
      totalTarget += goal.targetAmount;
      totalSaved += goal.currentAmount;
      
      if (goal.isCompleted) {
        completedGoals++;
      } else {
        activeGoals++;
      }
    }
    
    return {
      totalGoals: goals.length,
      activeGoals,
      completedGoals,
      totalTarget,
      totalSaved,
      totalRemaining: totalTarget - totalSaved,
      percentComplete: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
    };
  },
});
