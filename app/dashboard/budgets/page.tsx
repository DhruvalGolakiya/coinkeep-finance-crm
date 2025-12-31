"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { BudgetCard, BudgetSummaryCard } from "@/components/budgets/budget-card";
import { BudgetForm } from "@/components/budgets/budget-form";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { Plus, Wallet } from "@phosphor-icons/react";

export default function BudgetsPage() {
  const { user } = useAuth();
  const budgets = useQuery(api.budgets.listActive);
  const summary = useQuery(api.budgets.getSummary);
  
  const deleteBudget = useMutation(api.budgets.remove);
  const toggleActive = useMutation(api.budgets.toggleActive);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<{
    _id: Id<"budgets">;
    categoryId: Id<"categories">;
    amount: number;
    period: "weekly" | "monthly" | "yearly";
  } | null>(null);

  const handleEdit = (id: Id<"budgets">) => {
    const budget = budgets?.find(b => b._id === id);
    if (budget) {
      setEditingBudget({
        _id: budget._id,
        categoryId: budget.categoryId,
        amount: budget.amount,
        period: budget.period,
      });
      setFormOpen(true);
    }
  };

  const handleDelete = async (id: Id<"budgets">) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      await deleteBudget({ id });
    }
  };

  const handleToggleActive = async (id: Id<"budgets">) => {
    await toggleActive({ id });
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingBudget(null);
    }
  };

  const isLoading = budgets === undefined || summary === undefined;

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Budgets"
        subtitle="Set spending limits and track your progress"
      >
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="size-4" weight="bold" />
          <span>Add Budget</span>
        </Button>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          </div>
        ) : budgets.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia>
                <Wallet className="size-12 text-muted-foreground" weight="duotone" />
              </EmptyMedia>
              <EmptyTitle>No budgets yet</EmptyTitle>
              <EmptyDescription>
                Create budgets to set spending limits for your categories and track your progress.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setFormOpen(true)} className="gap-2">
                <Plus className="size-4" weight="bold" />
                <span>Create Your First Budget</span>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <BudgetSummaryCard 
              summary={summary} 
              currency={user?.currency || "USD"} 
            />

            <div>
              <h2 className="text-sm font-medium mb-4">Active Budgets</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {budgets.map((budget) => (
                  <BudgetCard
                    key={budget._id}
                    budget={budget as {
                      _id: Id<"budgets">;
                      amount: number;
                      period: "weekly" | "monthly" | "yearly";
                      isActive: boolean;
                      spent: number;
                      remaining: number;
                      percentUsed: number;
                      category: { name: string; icon: string; color: string } | null;
                    }}
                    currency={user?.currency || "USD"}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BudgetForm
        open={formOpen}
        onOpenChange={handleFormClose}
        editingBudget={editingBudget}
        currency={user?.currency || "USD"}
      />
    </div>
  );
}
