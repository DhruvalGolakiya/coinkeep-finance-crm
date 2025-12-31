"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DotsThreeVertical,
  PencilSimple,
  Trash,
  Pause,
  Play
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";

interface BudgetCardProps {
  budget: {
    _id: Id<"budgets">;
    amount: number;
    period: "weekly" | "monthly" | "yearly";
    isActive: boolean;
    spent: number;
    remaining: number;
    percentUsed: number;
    category: {
      name: string;
      icon: string;
      color: string;
    } | null;
  };
  currency: string;
  onEdit: (id: Id<"budgets">) => void;
  onDelete: (id: Id<"budgets">) => void;
  onToggleActive: (id: Id<"budgets">) => void;
}

export function BudgetCard({ 
  budget, 
  currency,
  onEdit, 
  onDelete, 
  onToggleActive 
}: BudgetCardProps) {
  const isOverBudget = budget.percentUsed > 100;
  const isNearLimit = budget.percentUsed >= 80 && budget.percentUsed <= 100;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const periodLabel = {
    weekly: "/ week",
    monthly: "/ month",
    yearly: "/ year",
  }[budget.period];

  return (
    <Card className={`relative ${!budget.isActive ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="size-10 rounded-sm flex items-center justify-center text-white"
              style={{ backgroundColor: budget.category?.color || "#6366f1" }}
            >
              <span className="text-sm font-medium">
                {budget.category?.name?.charAt(0) || "B"}
              </span>
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {budget.category?.name || "Unknown Category"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(budget.amount)} {periodLabel}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 hover:bg-muted rounded-sm">
              <DotsThreeVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(budget._id)}>
                <PencilSimple className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleActive(budget._id)}>
                {budget.isActive ? (
                  <>
                    <Pause className="size-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="size-4 mr-2" />
                    Resume
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(budget._id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="size-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {formatCurrency(budget.spent)} spent
            </span>
            <span className={`font-medium ${
              isOverBudget 
                ? "text-destructive" 
                : isNearLimit 
                  ? "text-yellow-600" 
                  : "text-muted-foreground"
            }`}>
              {isOverBudget 
                ? `${formatCurrency(Math.abs(budget.remaining))} over` 
                : `${formatCurrency(budget.remaining)} left`}
            </span>
          </div>
          <Progress 
            value={Math.min(budget.percentUsed, 100)} 
            variant={isOverBudget ? "danger" : isNearLimit ? "warning" : "default"}
            className="h-2"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{Math.round(budget.percentUsed)}% used</span>
            {!budget.isActive && (
              <span className="text-yellow-600">Paused</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface BudgetSummaryCardProps {
  summary: {
    totalBudgets: number;
    totalBudgeted: number;
    totalSpent: number;
    remaining: number;
    onTrack: number;
    overBudget: number;
    percentUsed: number;
  };
  currency: string;
}

export function BudgetSummaryCard({ summary, currency }: BudgetSummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Budgeted</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Spent</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.totalSpent)}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Overall</span>
            <span className="font-medium">
              {formatCurrency(summary.remaining)} remaining
            </span>
          </div>
          <Progress 
            value={Math.min(summary.percentUsed, 100)} 
            variant={summary.percentUsed > 100 ? "danger" : summary.percentUsed >= 80 ? "warning" : "default"}
            className="h-2" 
          />
        </div>

        <div className="flex gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">
              {summary.onTrack} on track
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">
              {summary.overBudget} over budget
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
