"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  DotsThreeVertical,
  PencilSimple,
  Trash,
  Check,
  Plus,
  Target,
  CalendarBlank,
  ArrowClockwise
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";

interface GoalCardProps {
  goal: {
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
  };
  currency: string;
  onEdit: (id: Id<"goals">) => void;
  onDelete: (id: Id<"goals">) => void;
  onAddContribution: (id: Id<"goals">) => void;
  onMarkComplete: (id: Id<"goals">) => void;
  onReopen: (id: Id<"goals">) => void;
}

export function GoalCard({ 
  goal, 
  currency,
  onEdit, 
  onDelete, 
  onAddContribution,
  onMarkComplete,
  onReopen
}: GoalCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTimeLabel = () => {
    if (goal.isCompleted) return "Completed!";
    if (!goal.targetDate) return "No deadline";
    if (goal.isOverdue) return `${Math.abs(goal.daysRemaining!)} days overdue`;
    if (goal.daysRemaining === 0) return "Due today";
    if (goal.daysRemaining === 1) return "1 day left";
    if (goal.daysRemaining! <= 30) return `${goal.daysRemaining} days left`;
    const months = Math.ceil(goal.daysRemaining! / 30);
    return `~${months} month${months > 1 ? "s" : ""} left`;
  };

  return (
    <Card className={`relative ${goal.isCompleted ? "opacity-75" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="size-10 rounded-sm flex items-center justify-center"
              style={{ backgroundColor: goal.color || "#6366f1" }}
            >
              <Target className="size-5 text-white" weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  {goal.name}
                </CardTitle>
                {goal.isCompleted && (
                  <Badge variant="outline" className="text-[10px] text-green-600 border-green-600">
                    <Check className="size-3 mr-1" weight="bold" />
                    Complete
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {goal.targetDate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarBlank className="size-3" />
                    {format(goal.targetDate, "MMM d, yyyy")}
                  </p>
                )}
                {goal.linkedAccount && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {goal.linkedAccount.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="p-1 hover:bg-muted rounded-sm">
              <DotsThreeVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!goal.isCompleted && (
                <>
                  <DropdownMenuItem onClick={() => onAddContribution(goal._id)}>
                    <Plus className="size-4 mr-2" />
                    Add Contribution
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMarkComplete(goal._id)}>
                    <Check className="size-4 mr-2" />
                    Mark Complete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {goal.isCompleted && (
                <>
                  <DropdownMenuItem onClick={() => onReopen(goal._id)}>
                    <ArrowClockwise className="size-4 mr-2" />
                    Reopen Goal
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => onEdit(goal._id)}>
                <PencilSimple className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(goal._id)}
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
              {formatCurrency(goal.currentAmount)} saved
            </span>
            <span className="font-medium">
              {formatCurrency(goal.targetAmount)} goal
            </span>
          </div>
          <Progress 
            value={Math.min(goal.percentComplete, 100)} 
            className="h-2"
            style={{ 
              ["--progress-color" as string]: goal.isCompleted ? "#22c55e" : (goal.color || "#6366f1") 
            }}
          />
          <div className="flex justify-between text-[10px]">
            <span className={`${
              goal.isOverdue 
                ? "text-destructive font-medium" 
                : goal.isCompleted 
                  ? "text-green-600 font-medium"
                  : "text-muted-foreground"
            }`}>
              {getTimeLabel()}
            </span>
            <span className="text-muted-foreground">
              {Math.round(goal.percentComplete)}% complete
            </span>
          </div>
        </div>

        {!goal.isCompleted && goal.monthlyNeeded && goal.monthlyNeeded > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-sm">
            Save <span className="font-medium text-foreground">{formatCurrency(goal.monthlyNeeded)}/month</span> to reach your goal on time
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GoalSummaryCardProps {
  summary: {
    totalGoals: number;
    activeGoals: number;
    completedGoals: number;
    totalTarget: number;
    totalSaved: number;
    totalRemaining: number;
    percentComplete: number;
  };
  currency: string;
}

export function GoalSummaryCard({ summary, currency }: GoalSummaryCardProps) {
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
        <CardTitle className="text-sm font-medium">Goals Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Saved</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.totalSaved)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Target</p>
            <p className="text-lg font-semibold">{formatCurrency(summary.totalTarget)}</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {formatCurrency(summary.totalRemaining)} to go
            </span>
          </div>
          <Progress value={Math.min(summary.percentComplete, 100)} className="h-2" />
        </div>

        <div className="flex gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">
              {summary.activeGoals} active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">
              {summary.completedGoals} completed
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
