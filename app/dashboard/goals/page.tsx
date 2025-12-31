"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { GoalCard, GoalSummaryCard } from "@/components/goals/goal-card";
import { GoalForm, ContributionForm } from "@/components/goals/goal-form";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { Plus, Target } from "@phosphor-icons/react";

export default function GoalsPage() {
  const { user } = useAuth();
  const goals = useQuery(api.goals.listActive);
  const summary = useQuery(api.goals.getSummary);
  
  const deleteGoal = useMutation(api.goals.remove);
  const markComplete = useMutation(api.goals.markComplete);
  const reopenGoal = useMutation(api.goals.reopenGoal);
  
  const [formOpen, setFormOpen] = useState(false);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<{
    id: Id<"goals">;
    name: string;
  } | null>(null);
  const [editingGoal, setEditingGoal] = useState<{
    _id: Id<"goals">;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: number;
    linkedAccountId?: Id<"accounts">;
    color?: string;
  } | null>(null);

  const handleEdit = (id: Id<"goals">) => {
    const goal = goals?.find(g => g._id === id);
    if (goal) {
      setEditingGoal({
        _id: goal._id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: goal.targetDate ?? undefined,
        linkedAccountId: goal.linkedAccountId ?? undefined,
        color: goal.color ?? undefined,
      });
      setFormOpen(true);
    }
  };

  const handleDelete = async (id: Id<"goals">) => {
    if (confirm("Are you sure you want to delete this goal?")) {
      await deleteGoal({ id });
    }
  };

  const handleAddContribution = (id: Id<"goals">) => {
    const goal = goals?.find(g => g._id === id);
    if (goal) {
      setSelectedGoalForContribution({ id, name: goal.name });
      setContributionOpen(true);
    }
  };

  const handleMarkComplete = async (id: Id<"goals">) => {
    await markComplete({ id });
  };

  const handleReopen = async (id: Id<"goals">) => {
    await reopenGoal({ id });
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingGoal(null);
    }
  };

  const handleContributionClose = (open: boolean) => {
    setContributionOpen(open);
    if (!open) {
      setSelectedGoalForContribution(null);
    }
  };

  const isLoading = goals === undefined || summary === undefined;

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Goals"
        subtitle="Track your savings and financial targets"
      >
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <Plus className="size-4" weight="bold" />
          <span>Add Goal</span>
        </Button>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          </div>
        ) : goals.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia>
                <Target className="size-12 text-muted-foreground" weight="duotone" />
              </EmptyMedia>
              <EmptyTitle>No goals yet</EmptyTitle>
              <EmptyDescription>
                Create savings goals to track your progress toward financial milestones like emergency funds, vacations, or major purchases.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setFormOpen(true)} className="gap-2">
                <Plus className="size-4" weight="bold" />
                <span>Create Your First Goal</span>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <GoalSummaryCard 
              summary={summary} 
              currency={user?.currency || "USD"} 
            />

            <div>
              <h2 className="text-sm font-medium mb-4">Active Goals</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {goals.map((goal) => (
                  <GoalCard
                    key={goal._id}
                    goal={goal as {
                      _id: Id<"goals">;
                      name: string;
                      targetAmount: number;
                      currentAmount: number;
                      targetDate?: number;
                      icon?: string;
                      color?: string;
                      isCompleted: boolean;
                      percentComplete: number;
                      remaining: number;
                      daysRemaining: number | null;
                      isOverdue: boolean;
                      monthlyNeeded?: number | null;
                      linkedAccount: { name: string } | null;
                    }}
                    currency={user?.currency || "USD"}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddContribution={handleAddContribution}
                    onMarkComplete={handleMarkComplete}
                    onReopen={handleReopen}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <GoalForm
        open={formOpen}
        onOpenChange={handleFormClose}
        editingGoal={editingGoal}
        currency={user?.currency || "USD"}
      />

      <ContributionForm
        open={contributionOpen}
        onOpenChange={handleContributionClose}
        goalId={selectedGoalForContribution?.id || null}
        goalName={selectedGoalForContribution?.name || ""}
        currency={user?.currency || "USD"}
      />
    </div>
  );
}
