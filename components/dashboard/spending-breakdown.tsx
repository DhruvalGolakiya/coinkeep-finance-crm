"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import { useFormatCurrency } from "@/lib/format";

export function SpendingBreakdown() {
  const formatCurrency = useFormatCurrency();
  const categoryData = useQuery(api.analytics.getCategoryBreakdown, { type: "expense" });
  const isLoading = !categoryData;

  const total = categoryData?.reduce((sum, cat) => sum + cat.amount, 0) ?? 0;
  const topCategories = categoryData?.slice(0, 5) ?? [];
  
  // Prepare data for horizontal bar chart
  const barData = topCategories.map((cat, index) => ({
    name: cat.name,
    amount: cat.amount,
    percentage: total > 0 ? Math.round((cat.amount / total) * 100) : 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Spending</CardTitle>
        <CardDescription>Top categories this month</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/reports" />}>
            <ArrowRightIcon className="size-3.5" />
          </Button>
        </CardAction>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        ) : topCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No expenses this month
            </p>
            <Button variant="outline" size="sm" className="mt-4" render={<Link href="/dashboard/transactions" />}>
              Add Expense
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total at top */}
            <div className="flex items-baseline justify-between border-b border-border pb-3">
              <span className="text-sm text-muted-foreground">Total spent</span>
              <span className="text-xl font-semibold">{formatCurrency(total)}</span>
            </div>

            {/* Horizontal Bar Chart */}
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={barData} 
                  layout="vertical"
                  margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                >
                  <XAxis 
                    type="number" 
                    hide 
                    domain={[0, 'dataMax']}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={80}
                    tick={{ 
                      fill: "var(--muted-foreground)", 
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                    content={({ payload }) => {
                      if (!payload || payload.length === 0) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                          <p className="text-xs font-medium">{data.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(data.amount)} ({data.percentage}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={[0, 4, 4, 0]}
                    maxBarSize={28}
                  >
                    {barData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={index === 0 ? "var(--primary)" : "var(--primary)"}
                        fillOpacity={1 - (index * 0.4)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
              <span>{topCategories.length} categories</span>
              {categoryData && categoryData.length > 5 && (
                <span>+{categoryData.length - 5} more</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
