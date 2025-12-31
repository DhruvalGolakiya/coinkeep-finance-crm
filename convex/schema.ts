import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    // Use case - determines which features are shown
    useCase: v.optional(v.union(
      v.literal("personal"),
      v.literal("freelancer"),
      v.literal("small_business"),
      v.literal("agency")
    )),
    // Business info
    businessName: v.optional(v.string()),
    businessType: v.optional(v.string()),
    // Location & Currency
    country: v.string(),
    currency: v.string(),
    timezone: v.optional(v.string()),
    // Preferences
    fiscalYearStart: v.optional(v.string()), // e.g., "january", "april"
    dateFormat: v.optional(v.string()), // e.g., "MM/DD/YYYY", "DD/MM/YYYY"
    // Onboarding
    onboardingCompleted: v.boolean(),
    onboardingStep: v.number(), // 0-4 for tracking progress
    createdAt: v.number(),
    lastLoginAt: v.number(),
  }).index("by_email", ["email"]),

  accounts: defineTable({
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
    createdAt: v.number(),
  }).index("by_type", ["type"]),

  transactions: defineTable({
    accountId: v.id("accounts"),
    type: v.union(
      v.literal("income"),
      v.literal("expense"),
      v.literal("transfer")
    ),
    amount: v.number(), // Amount in account's currency
    categoryId: v.optional(v.id("categories")),
    description: v.string(),
    date: v.number(),
    isBusinessExpense: v.boolean(),
    invoiceId: v.optional(v.id("invoices")),
    toAccountId: v.optional(v.id("accounts")), // For transfers
    notes: v.optional(v.string()),
    tags: v.optional(v.array(v.string())), // Tags/labels for filtering
    recurringId: v.optional(v.id("recurringTransactions")), // Link to recurring
    // Multi-currency support
    originalAmount: v.optional(v.number()), // Original amount before conversion
    originalCurrency: v.optional(v.string()), // Original currency (e.g., "USD")
    exchangeRate: v.optional(v.number()), // Exchange rate used
    createdAt: v.number(),
  })
    .index("by_account", ["accountId"])
    .index("by_date", ["date"])
    .index("by_category", ["categoryId"])
    .index("by_type", ["type"]),

  categories: defineTable({
    name: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    icon: v.string(),
    color: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
  }).index("by_type", ["type"]),

  clients: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    company: v.optional(v.string()),
    currency: v.optional(v.string()), // Client's preferred currency (e.g., "USD")
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }),

  invoices: defineTable({
    clientId: v.id("clients"),
    invoiceNumber: v.string(),
    items: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        rate: v.number(),
        amount: v.number(),
      })
    ),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
    currency: v.string(), // Invoice currency (e.g., "USD")
    issueDate: v.number(),
    dueDate: v.number(),
    subtotal: v.number(),
    tax: v.number(),
    taxRate: v.number(),
    total: v.number(),
    notes: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    // Payment conversion details
    paidAmount: v.optional(v.number()), // Amount received in account currency
    paidCurrency: v.optional(v.string()), // Account currency (e.g., "INR")
    exchangeRate: v.optional(v.number()), // Exchange rate used for conversion
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_due_date", ["dueDate"]),

  budgets: defineTable({
    categoryId: v.id("categories"),
    amount: v.number(),
    period: v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    ),
    startDate: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_category", ["categoryId"])
    .index("by_active", ["isActive"]),

  recurringTransactions: defineTable({
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
    lastProcessedDate: v.optional(v.number()),
    isActive: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_account", ["accountId"])
    .index("by_next_due", ["nextDueDate"])
    .index("by_active", ["isActive"]),

  goals: defineTable({
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    targetDate: v.optional(v.number()),
    linkedAccountId: v.optional(v.id("accounts")),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isCompleted: v.boolean(),
    createdAt: v.number(),
  }).index("by_completed", ["isCompleted"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
