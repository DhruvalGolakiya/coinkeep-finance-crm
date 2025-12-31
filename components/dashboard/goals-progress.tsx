"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Target } from "@phosphor-icons/react";

interface GoalsProgressProps {
  currency: string;
}

export function GoalsProgress({ currency }: GoalsProgressProps) {
  const goals = useQuery(api.goals.listActive);
  const summary = useQuery(api.goals.getSummary);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (goals === undefined || summary === undefined) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="size-4" weight="duotone" />
            Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Set savings goals to track your progress
            </p>
            <Button variant="outline" size="sm">
              <Link href="/dashboard/goals">Create Goal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show top 3 goals sorted by progress (closest to completion first)
  const topGoals = [...goals]
    .filter(g => !g.isCompleted)
    .sort((a, b) => b.percentComplete - a.percentComplete)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="size-4" weight="duotone" />
            Goals
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {Math.round(summary.percentComplete)}% overall
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {topGoals.map((goal) => (
          <div key={goal._id} className="space-y-1">
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-2">
                <div 
                  className="size-2 rounded-full"
                  style={{ backgroundColor: goal.color || "#6366f1" }}
                />
                <span className="font-medium truncate max-w-[100px]">
                  {goal.name}
                </span>
              </div>
              <span className="text-muted-foreground">
                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
              </span>
            </div>
            <Progress 
              value={Math.min(goal.percentComplete, 100)} 
              className="h-1.5"
            />
          </div>
        ))}

        {goals.length > 3 && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            +{goals.length - 3} more goals
          </p>
        )}

        <div className="pt-2 border-t">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Total saved</span>
            <span className="font-medium">{formatCurrency(summary.totalSaved)}</span>
          </div>
          <Button variant="ghost" size="sm" className="w-full h-7 text-xs">
            <Link href="/dashboard/goals" className="flex items-center gap-1">
              View All Goals
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
