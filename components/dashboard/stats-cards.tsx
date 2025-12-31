"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendUpIcon, TrendDownIcon, MinusIcon } from "@phosphor-icons/react";
import { useFormatCurrency } from "@/lib/format";

interface StatsCardsProps {
  stats?: {
    netWorth: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    pendingInvoices: number;
    pendingInvoiceAmount: number;
    // Pending CC balance (informational - already reflected in expenses)
    pendingCCBalance?: number;
  };
  isLoading: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const formatCurrency = useFormatCurrency();
  
  const savingsRate = stats && stats.monthlyIncome > 0 
    ? Math.round((stats.monthlySavings / stats.monthlyIncome) * 100) 
    : 0;

  const hasPendingLiabilities = (stats?.pendingCCBalance ?? 0) > 0;
  
  const metrics = [
    {
      label: "Income",
      description: "This month",
      value: stats?.monthlyIncome ?? 0,
      trend: "up" as const,
    },
    {
      label: "Expenses", 
      description: "This month (incl. CC)",
      value: stats?.monthlyExpenses ?? 0,
      trend: "down" as const,
    },
    {
      label: "Net Flow",
      description: "Income − Expenses",
      value: stats?.monthlySavings ?? 0,
      trend: (stats?.monthlySavings ?? 0) >= 0 ? "up" as const : "down" as const,
    },
    {
      label: "Pending",
      description: stats?.pendingInvoices ? `${stats.pendingInvoices} invoice${stats.pendingInvoices > 1 ? "s" : ""}` : "No invoices",
      value: stats?.pendingInvoiceAmount ?? 0,
      trend: "neutral" as const,
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Net Worth</span>
            <Badge variant="secondary">
              <TrendUpIcon className="size-3" />
              All time
            </Badge>
          </CardTitle>
          <CardDescription>Total balance across all accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <p className="text-4xl font-semibold tracking-tight">
              {formatCurrency(stats?.netWorth ?? 0)}
            </p>
          )}
          
          {/* Pending CC Balance - informational, already reflected in net worth */}
          {!isLoading && hasPendingLiabilities && (
            <div className="rounded-md bg-muted/50 border border-border px-3 py-2">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">CC Balance: </span>
                {formatCurrency(stats?.pendingCCBalance ?? 0)}
              </p>
            </div>
          )}
          
          {/* Savings Rate - only show if there's income */}
          {(stats?.monthlyIncome ?? 0) > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Savings Rate</span>
                <span className="font-medium">{savingsRate}%</span>
              </div>
              <Progress 
                value={Math.min(Math.max(savingsRate, 0), 100)} 
                variant={savingsRate < 0 ? "danger" : savingsRate < 10 ? "warning" : "default"}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No income recorded this month
            </p>
          )}
        </CardContent>
      </Card>

      {/* Metric Cards */}
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {metric.trend === "up" ? (
                <TrendUpIcon className="size-4 text-foreground" />
              ) : metric.trend === "down" ? (
                <TrendDownIcon className="size-4 text-muted-foreground" />
              ) : (
                <MinusIcon className="size-4 text-muted-foreground" />
              )}
              {metric.label}
            </CardTitle>
            <CardDescription>{metric.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-semibold tracking-tight">
                {formatCurrency(metric.value, { compact: true })}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
