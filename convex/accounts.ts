import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("accounts").collect();
  },
});

export const getById = query({
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByType = query({
  args: {
    type: v.union(
      v.literal("bank"),
      v.literal("credit_card"),
      v.literal("cash"),
      v.literal("investment"),
      v.literal("asset")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("accounts")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(
      v.literal("bank"),
      v.literal("credit_card"),
      v.literal("cash"),
      v.literal("investment"),
      v.literal("asset")
    ),
    balance: v.number(),
    currency: v.string(),
    isBusinessAccount: v.boolean(),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("accounts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("accounts"),
    name: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("bank"),
        v.literal("credit_card"),
        v.literal("cash"),
        v.literal("investment"),
        v.literal("asset")
      )
    ),
    balance: v.optional(v.number()),
    currency: v.optional(v.string()),
    isBusinessAccount: v.optional(v.boolean()),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
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
  args: { id: v.id("accounts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const updateBalance = mutation({
  args: {
    id: v.id("accounts"),
    amount: v.number(),
    operation: v.union(v.literal("add"), v.literal("subtract")),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.id);
    if (!account) throw new Error("Account not found");

    const newBalance =
      args.operation === "add"
        ? account.balance + args.amount
        : account.balance - args.amount;

    await ctx.db.patch(args.id, { balance: newBalance });
    return newBalance;
  },
});

export const getTotalBalance = query({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("accounts").collect();
    
    let assets = 0;
    let liabilities = 0;

    for (const account of accounts) {
      if (account.type === "credit_card") {
        liabilities += Math.abs(account.balance);
      } else {
        assets += account.balance;
      }
    }

    return {
      assets,
      liabilities,
      netWorth: assets - liabilities,
    };
  },
});

// Batch create accounts (for onboarding)
export const batchCreate = mutation({
  args: {
    accounts: v.array(
      v.object({
        name: v.string(),
        type: v.union(
          v.literal("bank"),
          v.literal("credit_card"),
          v.literal("cash"),
          v.literal("investment"),
          v.literal("asset")
        ),
        balance: v.number(),
        currency: v.string(),
        isBusinessAccount: v.boolean(),
        color: v.optional(v.string()),
        icon: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const account of args.accounts) {
      const id = await ctx.db.insert("accounts", {
        ...account,
        createdAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

// Account templates by use case
const PERSONAL_ACCOUNTS = [
  { name: "Checking Account", type: "bank" as const, color: "#6366f1", icon: "Bank", isBusinessAccount: false },
  { name: "Savings Account", type: "bank" as const, color: "#818cf8", icon: "PiggyBank", isBusinessAccount: false },
  { name: "Cash", type: "cash" as const, color: "#a5b4fc", icon: "Wallet", isBusinessAccount: false },
  { name: "Credit Card", type: "credit_card" as const, color: "#8b7355", icon: "CreditCard", isBusinessAccount: false },
];

const FREELANCER_ACCOUNTS = [
  { name: "Personal Checking", type: "bank" as const, color: "#6366f1", icon: "Bank", isBusinessAccount: false },
  { name: "Business Checking", type: "bank" as const, color: "#818cf8", icon: "Briefcase", isBusinessAccount: true },
  { name: "Savings", type: "bank" as const, color: "#a5b4fc", icon: "PiggyBank", isBusinessAccount: false },
  { name: "Tax Reserve", type: "bank" as const, color: "#705845", icon: "Receipt", isBusinessAccount: true },
  { name: "Cash", type: "cash" as const, color: "#d4b896", icon: "Wallet", isBusinessAccount: false },
  { name: "Business Credit Card", type: "credit_card" as const, color: "#8b7355", icon: "CreditCard", isBusinessAccount: true },
];

const BUSINESS_ACCOUNTS = [
  { name: "Business Checking", type: "bank" as const, color: "#6366f1", icon: "Bank", isBusinessAccount: true },
  { name: "Business Savings", type: "bank" as const, color: "#818cf8", icon: "PiggyBank", isBusinessAccount: true },
  { name: "Tax Reserve", type: "bank" as const, color: "#705845", icon: "Receipt", isBusinessAccount: true },
  { name: "Payroll Account", type: "bank" as const, color: "#a5b4fc", icon: "Users", isBusinessAccount: true },
  { name: "Petty Cash", type: "cash" as const, color: "#d4b896", icon: "Wallet", isBusinessAccount: true },
  { name: "Business Credit Card", type: "credit_card" as const, color: "#8b7355", icon: "CreditCard", isBusinessAccount: true },
];

// Seed starter accounts based on use case
export const seedForUseCase = mutation({
  args: {
    useCase: v.union(
      v.literal("personal"),
      v.literal("freelancer"),
      v.literal("small_business"),
      v.literal("agency")
    ),
    currency: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("accounts").collect();
    if (existing.length > 0) return;

    let accounts;
    switch (args.useCase) {
      case "personal":
        accounts = PERSONAL_ACCOUNTS;
        break;
      case "freelancer":
        accounts = FREELANCER_ACCOUNTS;
        break;
      case "small_business":
      case "agency":
        accounts = BUSINESS_ACCOUNTS;
        break;
      default:
        accounts = PERSONAL_ACCOUNTS;
    }

    for (const account of accounts) {
      await ctx.db.insert("accounts", {
        ...account,
        balance: 0,
        currency: args.currency,
        createdAt: Date.now(),
      });
    }
  },
});

