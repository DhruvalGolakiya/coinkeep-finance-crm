import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const invoices = await ctx.db.query("invoices").order("desc").collect();

    const enriched = await Promise.all(
      invoices.map(async (inv) => {
        const client = await ctx.db.get(inv.clientId);
        return { ...inv, client };
      })
    );

    return enriched;
  },
});

export const getById = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) return null;

    const client = await ctx.db.get(invoice.clientId);
    return { ...invoice, client };
  },
});

export const getByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

export const getByStatus = query({
  args: {
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
  },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    const enriched = await Promise.all(
      invoices.map(async (inv) => {
        const client = await ctx.db.get(inv.clientId);
        return { ...inv, client };
      })
    );

    return enriched;
  },
});

export const create = mutation({
  args: {
    clientId: v.id("clients"),
    items: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        rate: v.number(),
        amount: v.number(),
      })
    ),
    currency: v.string(),
    issueDate: v.number(),
    dueDate: v.number(),
    taxRate: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate invoice number
    const allInvoices = await ctx.db.query("invoices").collect();
    const invoiceNumber = `INV-${String(allInvoices.length + 1).padStart(5, "0")}`;

    // Calculate totals
    const subtotal = args.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (args.taxRate / 100);
    const total = subtotal + tax;

    return await ctx.db.insert("invoices", {
      clientId: args.clientId,
      invoiceNumber,
      items: args.items,
      status: "draft",
      currency: args.currency,
      issueDate: args.issueDate,
      dueDate: args.dueDate,
      subtotal,
      tax,
      taxRate: args.taxRate,
      total,
      notes: args.notes,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("invoices"),
    items: v.optional(
      v.array(
        v.object({
          description: v.string(),
          quantity: v.number(),
          rate: v.number(),
          amount: v.number(),
        })
      )
    ),
    currency: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const invoice = await ctx.db.get(id);
    if (!invoice) throw new Error("Invoice not found");

    const items = updates.items ?? invoice.items;
    const taxRate = updates.taxRate ?? invoice.taxRate;

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    await ctx.db.patch(id, {
      ...updates,
      subtotal,
      tax,
      total,
    });

    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue")
    ),
  },
  handler: async (ctx, args) => {
    const updates: { status: typeof args.status; paidAt?: number } = {
      status: args.status,
    };

    if (args.status === "paid") {
      updates.paidAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const markAsPaid = mutation({
  args: {
    id: v.id("invoices"),
    accountId: v.id("accounts"),
    convertedAmount: v.optional(v.number()), // Amount in account's currency
    exchangeRate: v.optional(v.number()), // Exchange rate used
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error("Account not found");

    // Find or create a "Client Payments" category for invoice income
    let clientPaymentsCategory = await ctx.db
      .query("categories")
      .filter((q) =>
        q.and(
          q.eq(q.field("name"), "Client Payments"),
          q.eq(q.field("type"), "income")
        )
      )
      .first();

    // If category doesn't exist, create it
    if (!clientPaymentsCategory) {
      const categoryId = await ctx.db.insert("categories", {
        name: "Client Payments",
        type: "income",
        icon: "CurrencyCircleDollar",
        color: "#6366f1",
        isDefault: true,
        createdAt: Date.now(),
      });
      clientPaymentsCategory = await ctx.db.get(categoryId);
    }

    // Determine the amount to record in account's currency
    // If currencies are different and conversion provided, use converted amount
    // Otherwise use the invoice total directly
    const recordAmount = args.convertedAmount ?? invoice.total;

    // Update invoice status with payment details
    await ctx.db.patch(args.id, {
      status: "paid",
      paidAt: Date.now(),
      paidAmount: recordAmount,
      paidCurrency: account.currency,
      exchangeRate: args.exchangeRate,
    });

    // Create income transaction with original currency info
    const transactionId = await ctx.db.insert("transactions", {
      accountId: args.accountId,
      type: "income",
      amount: recordAmount, // Amount in account's currency
      categoryId: clientPaymentsCategory?._id, // Auto-assign Client Payments category
      description: `Payment for ${invoice.invoiceNumber}`,
      date: Date.now(),
      isBusinessExpense: true,
      invoiceId: args.id,
      // Store original amount if currency was converted
      originalAmount: args.convertedAmount ? invoice.total : undefined,
      originalCurrency: args.convertedAmount ? invoice.currency : undefined,
      exchangeRate: args.exchangeRate,
      createdAt: Date.now(),
    });

    // Update account balance
    await ctx.db.patch(args.accountId, {
      balance: account.balance + recordAmount,
    });

    return transactionId;
  },
});

export const remove = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const invoices = await ctx.db.query("invoices").collect();

    const stats = {
      total: invoices.length,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };

    const now = Date.now();

    for (const inv of invoices) {
      // Check if should be marked overdue (for display purposes only in query)
      const effectiveStatus =
        inv.status === "sent" && inv.dueDate < now ? "overdue" : inv.status;
      
      stats[effectiveStatus]++;
      stats.totalAmount += inv.total;

      if (effectiveStatus === "paid") {
        stats.paidAmount += inv.total;
      } else {
        stats.pendingAmount += inv.total;
      }
    }

    return stats;
  },
});

