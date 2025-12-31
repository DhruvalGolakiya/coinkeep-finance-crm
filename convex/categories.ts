import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const getByType = query({
  args: { type: v.union(v.literal("income"), v.literal("expense")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    icon: v.string(),
    color: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", {
      ...args,
      isDefault: args.isDefault ?? false,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
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
  args: { id: v.id("categories") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (category?.isDefault) {
      throw new Error("Cannot delete default categories");
    }
    await ctx.db.delete(args.id);
  },
});

// Category definitions by use case
const PERSONAL_CATEGORIES = [
  // Income categories
  { name: "Salary", type: "income" as const, icon: "Wallet", color: "#6366f1" },
  { name: "Freelance", type: "income" as const, icon: "Briefcase", color: "#818cf8" },
  { name: "Investments", type: "income" as const, icon: "TrendUp", color: "#a5b4fc" },
  { name: "Rental Income", type: "income" as const, icon: "House", color: "#c7d2fe" },
  { name: "Gifts", type: "income" as const, icon: "Gift", color: "#4f46e5" },
  { name: "Other Income", type: "income" as const, icon: "Plus", color: "#4f46e5" },
  
  // Expense categories
  { name: "Food & Dining", type: "expense" as const, icon: "ForkKnife", color: "#8b7355" },
  { name: "Groceries", type: "expense" as const, icon: "ShoppingBag", color: "#a08060" },
  { name: "Transportation", type: "expense" as const, icon: "Car", color: "#b58d6b" },
  { name: "Shopping", type: "expense" as const, icon: "ShoppingCart", color: "#ca9a82" },
  { name: "Entertainment", type: "expense" as const, icon: "GameController", color: "#d4b896" },
  { name: "Bills & Utilities", type: "expense" as const, icon: "Lightning", color: "#705845" },
  { name: "Healthcare", type: "expense" as const, icon: "FirstAid", color: "#9f8270" },
  { name: "Personal Care", type: "expense" as const, icon: "Heart", color: "#8b7355" },
  { name: "Education", type: "expense" as const, icon: "GraduationCap", color: "#ca9a82" },
  { name: "Travel", type: "expense" as const, icon: "Airplane", color: "#705845" },
  { name: "Subscriptions", type: "expense" as const, icon: "Repeat", color: "#5c4a3d" },
  { name: "Insurance", type: "expense" as const, icon: "Shield", color: "#d4b896" },
  { name: "Other Expenses", type: "expense" as const, icon: "DotsThree", color: "#5c4a3d" },
];

const BUSINESS_CATEGORIES = [
  // Income categories
  { name: "Client Payments", type: "income" as const, icon: "CurrencyCircleDollar", color: "#6366f1" },
  { name: "Project Revenue", type: "income" as const, icon: "Briefcase", color: "#818cf8" },
  { name: "Consulting", type: "income" as const, icon: "UserCircle", color: "#a5b4fc" },
  { name: "Retainer Income", type: "income" as const, icon: "Repeat", color: "#c7d2fe" },
  { name: "Product Sales", type: "income" as const, icon: "Package", color: "#4f46e5" },
  { name: "Other Revenue", type: "income" as const, icon: "Plus", color: "#4f46e5" },
  
  // Expense categories
  { name: "Office Supplies", type: "expense" as const, icon: "Notebook", color: "#8b7355" },
  { name: "Software & Tools", type: "expense" as const, icon: "Code", color: "#a08060" },
  { name: "Marketing", type: "expense" as const, icon: "Megaphone", color: "#b58d6b" },
  { name: "Professional Services", type: "expense" as const, icon: "UserCircle", color: "#ca9a82" },
  { name: "Travel & Meals", type: "expense" as const, icon: "Airplane", color: "#d4b896" },
  { name: "Equipment", type: "expense" as const, icon: "Desktop", color: "#705845" },
  { name: "Rent & Utilities", type: "expense" as const, icon: "House", color: "#9f8270" },
  { name: "Insurance", type: "expense" as const, icon: "Shield", color: "#8b7355" },
  { name: "Taxes", type: "expense" as const, icon: "Receipt", color: "#ca9a82" },
  { name: "Bank Fees", type: "expense" as const, icon: "Bank", color: "#705845" },
  { name: "Contractors", type: "expense" as const, icon: "Users", color: "#5c4a3d" },
  { name: "Training", type: "expense" as const, icon: "GraduationCap", color: "#d4b896" },
  { name: "Subscriptions", type: "expense" as const, icon: "Repeat", color: "#5c4a3d" },
  { name: "Other Expenses", type: "expense" as const, icon: "DotsThree", color: "#5c4a3d" },
];

// Seed default categories
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("categories").collect();
    if (existing.length > 0) return;

    // Default to personal categories
    for (const category of PERSONAL_CATEGORIES) {
      await ctx.db.insert("categories", {
        ...category,
        isDefault: true,
        createdAt: Date.now(),
      });
    }
  },
});

// Seed categories based on use case
export const seedForUseCase = mutation({
  args: {
    useCase: v.union(
      v.literal("personal"),
      v.literal("freelancer"),
      v.literal("small_business"),
      v.literal("agency")
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("categories").collect();
    if (existing.length > 0) return;

    const categories = args.useCase === "personal" 
      ? PERSONAL_CATEGORIES 
      : BUSINESS_CATEGORIES;

    for (const category of categories) {
      await ctx.db.insert("categories", {
        ...category,
        isDefault: true,
        createdAt: Date.now(),
      });
    }
  },
});

