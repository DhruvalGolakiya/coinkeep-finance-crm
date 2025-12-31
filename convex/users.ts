import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      // Update last login and return existing user
      await ctx.db.patch(existingUser._id, {
        lastLoginAt: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      country: "",
      currency: "",
      onboardingCompleted: false,
      onboardingStep: 0,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    });

    return userId;
  },
});

export const updateOnboarding = mutation({
  args: {
    email: v.string(),
    step: v.number(),
    data: v.object({
      useCase: v.optional(v.union(
        v.literal("personal"),
        v.literal("freelancer"),
        v.literal("small_business"),
        v.literal("agency")
      )),
      businessName: v.optional(v.string()),
      businessType: v.optional(v.string()),
      country: v.optional(v.string()),
      currency: v.optional(v.string()),
      timezone: v.optional(v.string()),
      fiscalYearStart: v.optional(v.string()),
      dateFormat: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      ...args.data,
      onboardingStep: args.step,
    });

    return user._id;
  },
});

export const completeOnboarding = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      onboardingCompleted: true,
      onboardingStep: 5,
    });

    return user._id;
  },
});

// Seed initial data based on user's use case
export const seedUserData = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user || !user.useCase || !user.currency) {
      return;
    }

    // Check if categories already exist
    const existingCategories = await ctx.db.query("categories").collect();
    if (existingCategories.length === 0) {
      // Import category seeding logic
      const PERSONAL_CATEGORIES = [
        { name: "Salary", type: "income" as const, icon: "Wallet", color: "#6366f1" },
        { name: "Freelance", type: "income" as const, icon: "Briefcase", color: "#818cf8" },
        { name: "Investments", type: "income" as const, icon: "TrendUp", color: "#a5b4fc" },
        { name: "Rental Income", type: "income" as const, icon: "House", color: "#c7d2fe" },
        { name: "Gifts", type: "income" as const, icon: "Gift", color: "#4f46e5" },
        { name: "Other Income", type: "income" as const, icon: "Plus", color: "#4f46e5" },
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
        { name: "Client Payments", type: "income" as const, icon: "CurrencyCircleDollar", color: "#6366f1" },
        { name: "Project Revenue", type: "income" as const, icon: "Briefcase", color: "#818cf8" },
        { name: "Consulting", type: "income" as const, icon: "UserCircle", color: "#a5b4fc" },
        { name: "Retainer Income", type: "income" as const, icon: "Repeat", color: "#c7d2fe" },
        { name: "Product Sales", type: "income" as const, icon: "Package", color: "#4f46e5" },
        { name: "Other Revenue", type: "income" as const, icon: "Plus", color: "#4f46e5" },
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

      const categories = user.useCase === "personal" ? PERSONAL_CATEGORIES : BUSINESS_CATEGORIES;
      for (const category of categories) {
        await ctx.db.insert("categories", {
          ...category,
          isDefault: true,
          createdAt: Date.now(),
        });
      }
    }

    // Check if accounts already exist
    const existingAccounts = await ctx.db.query("accounts").collect();
    if (existingAccounts.length === 0) {
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

      let accounts;
      switch (user.useCase) {
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
          currency: user.currency,
          createdAt: Date.now(),
        });
      }
    }
  },
});

export const get = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const updateProfile = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    businessName: v.optional(v.string()),
    currency: v.optional(v.string()),
    dateFormat: v.optional(v.string()),
    fiscalYearStart: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const { email, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(user._id, filteredUpdates);

    return user._id;
  },
});
