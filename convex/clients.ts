import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("clients").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    company: v.optional(v.string()),
    currency: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clients", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("clients"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    company: v.optional(v.string()),
    currency: v.optional(v.string()),
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
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    // Check for associated invoices
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_client", (q) => q.eq("clientId", args.id))
      .collect();

    if (invoices.length > 0) {
      throw new Error("Cannot delete client with existing invoices");
    }

    await ctx.db.delete(args.id);
  },
});

export const getWithInvoiceStats = query({
  args: {},
  handler: async (ctx) => {
    const clients = await ctx.db.query("clients").collect();

    const enriched = await Promise.all(
      clients.map(async (client) => {
        const invoices = await ctx.db
          .query("invoices")
          .withIndex("by_client", (q) => q.eq("clientId", client._id))
          .collect();

        const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const totalPaid = invoices
          .filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + inv.total, 0);
        const outstanding = totalBilled - totalPaid;

        return {
          ...client,
          invoiceCount: invoices.length,
          totalBilled,
          totalPaid,
          outstanding,
        };
      })
    );

    return enriched;
  },
});

