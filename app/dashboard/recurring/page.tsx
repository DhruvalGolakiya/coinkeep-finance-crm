"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurringCard } from "@/components/transactions/recurring-card";
import { RecurringForm } from "@/components/transactions/recurring-form";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { Plus, Repeat, ArrowDown, ArrowUp, Warning } from "@phosphor-icons/react";

export default function RecurringPage() {
  const { user } = useAuth();
  const recurring = useQuery(api.recurring.getUpcoming, { days: 90 });
  const summary = useQuery(api.recurring.getSummary);
  
  const deleteRecurring = useMutation(api.recurring.remove);
  const toggleActive = useMutation(api.recurring.toggleActive);
  const processRecurring = useMutation(api.recurring.processRecurring);
  const skipRecurring = useMutation(api.recurring.skipRecurring);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<{
    _id: Id<"recurringTransactions">;
    accountId: Id<"accounts">;
    type: "income" | "expense";
    amount: number;
    categoryId?: Id<"categories">;
    description: string;
    frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
    nextDueDate: number;
    notes?: string;
  } | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: user?.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleEdit = (id: Id<"recurringTransactions">) => {
    const r = recurring?.find(r => r._id === id);
    if (r) {
      setEditingRecurring({
        _id: r._id,
        accountId: r.accountId,
        type: r.type,
        amount: r.amount,
        categoryId: r.categoryId ?? undefined,
        description: r.description,
        frequency: r.frequency,
        nextDueDate: r.nextDueDate,
        notes: r.notes ?? undefined,
      });
      setFormOpen(true);
    }
  };

  const handleDelete = async (id: Id<"recurringTransactions">) => {
    if (confirm("Are you sure you want to delete this recurring transaction?")) {
      await deleteRecurring({ id });
    }
  };

  const handleToggleActive = async (id: Id<"recurringTransactions">) => {
    await toggleActive({ id });
  };

  const handleProcess = async (id: Id<"recurringTransactions">) => {
    if (confirm("This will create a transaction and update the next due date. Continue?")) {
      await processRecurring({ id });
    }
  };

  const handleSkip = async (id: Id<"recurringTransactions">) => {
    await skipRecurring({ id });
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingRecurring(null);
    }
  };

  const isLoading = recurring === undefined || summary === undefined;

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Recurring"
        subtitle="Manage your subscriptions and regular payments"
      >
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="size-4" weight="bold" />
          <span>Add Recurring</span>
        </Button>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        ) : recurring.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia>
                <Repeat className="size-12 text-muted-foreground" weight="duotone" />
              </EmptyMedia>
              <EmptyTitle>No recurring transactions</EmptyTitle>
              <EmptyDescription>
                Set up recurring transactions for subscriptions, bills, and regular income to track them automatically.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setFormOpen(true)} className="gap-2">
                <Plus className="size-4" weight="bold" />
                <span>Add Your First Recurring</span>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Monthly Income
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <ArrowDown className="size-4 text-green-600" weight="bold" />
                    <span className="text-lg font-semibold text-green-600">
                      +{formatCurrency(summary.monthlyIncome)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Monthly Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <ArrowUp className="size-4 text-red-600" weight="bold" />
                    <span className="text-lg font-semibold text-red-600">
                      -{formatCurrency(summary.monthlyExpenses)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Monthly Net
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <span className={`text-lg font-semibold ${
                    summary.monthlyNet >= 0 ? "text-green-600" : "text-red-600"
                  }`}>
                    {summary.monthlyNet >= 0 ? "+" : ""}{formatCurrency(summary.monthlyNet)}
                  </span>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Attention Needed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {summary.overdue > 0 && (
                      <div className="flex items-center gap-1 text-destructive">
                        <Warning className="size-4" weight="fill" />
                        <span className="text-sm font-medium">{summary.overdue} overdue</span>
                      </div>
                    )}
                    {summary.dueSoon > 0 && (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <span className="text-sm font-medium">{summary.dueSoon} due soon</span>
                      </div>
                    )}
                    {summary.overdue === 0 && summary.dueSoon === 0 && (
                      <span className="text-sm text-muted-foreground">All caught up!</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recurring list */}
            <div>
              <h2 className="text-sm font-medium mb-4">Upcoming Transactions</h2>
              <div className="space-y-3">
                {recurring.map((r) => (
                  <RecurringCard
                    key={r._id}
                    recurring={r as {
                      _id: Id<"recurringTransactions">;
                      type: "income" | "expense";
                      amount: number;
                      description: string;
                      frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
                      nextDueDate: number;
                      isActive: boolean;
                      daysUntilDue: number;
                      isOverdue: boolean;
                      isDueToday: boolean;
                      isDueSoon: boolean;
                      account: { name: string; color?: string } | null;
                      category: { name: string; color: string; icon: string } | null;
                    }}
                    currency={user?.currency || "USD"}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                    onProcess={handleProcess}
                    onSkip={handleSkip}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <RecurringForm
        open={formOpen}
        onOpenChange={handleFormClose}
        editingRecurring={editingRecurring}
        currency={user?.currency || "USD"}
      />
    </div>
  );
}
