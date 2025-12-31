"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ChartPieSlice, Warning } from "@phosphor-icons/react";

interface BudgetProgressProps {
  currency: string;
}

export function BudgetProgress({ currency }: BudgetProgressProps) {
  const budgets = useQuery(api.budgets.listActive);
  const summary = useQuery(api.budgets.getSummary);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (budgets === undefined || summary === undefined) {
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
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ChartPieSlice className="size-4" weight="duotone" />
            Budgets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Set up budgets to track your spending
            </p>
            <Button variant="outline" size="sm">
              <Link href="/dashboard/budgets">Create Budget</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show top 3 budgets sorted by percent used (highest first)
  const topBudgets = [...budgets]
    .sort((a, b) => b.percentUsed - a.percentUsed)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ChartPieSlice className="size-4" weight="duotone" />
            Budgets
          </CardTitle>
          {summary.overBudget > 0 && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <Warning className="size-3" weight="fill" />
              {summary.overBudget} over
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {topBudgets.map((budget) => {
          const isOverBudget = budget.percentUsed > 100;
          const isNearLimit = budget.percentUsed >= 80 && budget.percentUsed <= 100;
          
          return (
            <div key={budget._id} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium truncate max-w-[120px]">
                  {budget.category?.name || "Unknown"}
                </span>
                <span className={`${
                  isOverBudget 
                    ? "text-destructive" 
                    : isNearLimit 
                      ? "text-yellow-600" 
                      : "text-muted-foreground"
                }`}>
                  {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                </span>
              </div>
              <Progress 
                value={Math.min(budget.percentUsed, 100)} 
                variant={isOverBudget ? "danger" : isNearLimit ? "warning" : "default"}
                className="h-1.5"
              />
            </div>
          );
        })}
        
        {budgets.length > 3 && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            +{budgets.length - 3} more budgets
          </p>
        )}

        <div className="pt-2">
          <Button variant="ghost" size="sm" className="w-full h-7 text-xs">
            <Link href="/dashboard/budgets" className="flex items-center gap-1">
              View All Budgets
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
