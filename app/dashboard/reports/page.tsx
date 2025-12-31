"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import {
  DownloadSimple,
  TrendUp,
  TrendDown,
  ChartPieSlice,
  Receipt,
  CalendarBlank,
} from "@phosphor-icons/react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";

type DatePreset = "this_month" | "last_month" | "this_quarter" | "this_year" | "custom";

export default function ReportsPage() {
  const { user } = useAuth();
  const currency = user?.currency || "USD";
  
  const [activeTab, setActiveTab] = useState("overview");
  const [datePreset, setDatePreset] = useState<DatePreset>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Calculate date range based on preset
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case "this_month":
        return { start: startOfMonth(now).getTime(), end: endOfMonth(now).getTime() };
      case "last_month":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth).getTime(), end: endOfMonth(lastMonth).getTime() };
      case "this_quarter":
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
        return { start: quarterStart.getTime(), end: quarterEnd.getTime() };
      case "this_year":
        return { start: startOfYear(now).getTime(), end: endOfYear(now).getTime() };
      case "custom":
        return {
          start: customStart ? new Date(customStart).getTime() : startOfMonth(now).getTime(),
          end: customEnd ? new Date(customEnd).getTime() : endOfMonth(now).getTime(),
        };
      default:
        return { start: startOfMonth(now).getTime(), end: endOfMonth(now).getTime() };
    }
  }, [datePreset, customStart, customEnd]);

  // Queries
  const incomeSummary = useQuery(api.reports.getCategorySummary, {
    startDate: dateRange.start,
    endDate: dateRange.end,
    type: "income",
  });
  
  const expenseSummary = useQuery(api.reports.getCategorySummary, {
    startDate: dateRange.start,
    endDate: dateRange.end,
    type: "expense",
  });
  
  const budgetVsActual = useQuery(api.reports.getBudgetVsActual, {
    startDate: dateRange.start,
    endDate: dateRange.end,
  });
  
  const taxSummary = useQuery(api.reports.getTaxSummary, {
    startDate: dateRange.start,
    endDate: dateRange.end,
  });
  
  const exportData = useQuery(api.reports.getExportData, {
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportCSV = () => {
    if (!exportData || exportData.length === 0) return;
    
    const headers = Object.keys(exportData[0]).join(",");
    const rows = exportData.map(row => 
      Object.values(row).map(v => `"${v}"`).join(",")
    ).join("\n");
    
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(dateRange.start, "yyyy-MM-dd")}-to-${format(dateRange.end, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const presets: { value: DatePreset; label: string }[] = [
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "this_quarter", label: "This Quarter" },
    { value: "this_year", label: "This Year" },
    { value: "custom", label: "Custom" },
  ];

  return (
    <div className="flex h-full flex-col">
      <Header title="Reports" subtitle="Detailed financial reports and insights">
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!exportData?.length}>
          <DownloadSimple className="size-4 mr-2" />
          Export CSV
        </Button>
      </Header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Date Range Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <CalendarBlank className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium">Date Range:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={datePreset === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDatePreset(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              {datePreset === "custom" && (
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-36"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-36"
                  />
                </div>
              )}
              <div className="ml-auto text-sm text-muted-foreground">
                {format(dateRange.start, "MMM d, yyyy")} - {format(dateRange.end, "MMM d, yyyy")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="gap-2">
              <ChartPieSlice className="size-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="budget" className="gap-2">
              <Receipt className="size-4" />
              Budget vs Actual
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-2">
              <Receipt className="size-4" />
              Tax Summary
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Income Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendUp className="size-5 text-green-500" />
                        Income
                      </CardTitle>
                      <CardDescription>Income breakdown by category</CardDescription>
                    </div>
                    {incomeSummary && (
                      <span className="text-2xl font-bold text-green-600">
                        {formatCurrency(incomeSummary.total)}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!incomeSummary ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                  ) : incomeSummary.categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No income recorded in this period</p>
                  ) : (
                    <div className="space-y-3">
                      {incomeSummary.categories.map((cat) => (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span>{cat.name}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(cat.amount)}</span>
                          </div>
                          <Progress value={cat.percentage} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Expense Summary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendDown className="size-5 text-red-500" />
                        Expenses
                      </CardTitle>
                      <CardDescription>Expense breakdown by category</CardDescription>
                    </div>
                    {expenseSummary && (
                      <span className="text-2xl font-bold text-red-600">
                        {formatCurrency(expenseSummary.total)}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!expenseSummary ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
                    </div>
                  ) : expenseSummary.categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No expenses recorded in this period</p>
                  ) : (
                    <div className="space-y-3">
                      {expenseSummary.categories.map((cat) => (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="size-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span>{cat.name}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(cat.amount)}</span>
                          </div>
                          <Progress value={cat.percentage} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Net Summary */}
            {incomeSummary && expenseSummary && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Income</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(incomeSummary.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Expenses</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(expenseSummary.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Net</p>
                      <p className={`text-xl font-bold ${incomeSummary.total - expenseSummary.total >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(incomeSummary.total - expenseSummary.total)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Budget vs Actual Tab */}
          <TabsContent value="budget" className="space-y-6">
            {!budgetVsActual ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : budgetVsActual.comparisons.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Receipt className="size-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-1">No Active Budgets</h3>
                  <p className="text-sm text-muted-foreground">
                    Create budgets to compare your planned vs actual spending
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Total Budgeted</p>
                      <p className="text-2xl font-bold">{formatCurrency(budgetVsActual.totalBudgeted)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Actual Spending</p>
                      <p className="text-2xl font-bold">{formatCurrency(budgetVsActual.totalActual)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className={`text-2xl font-bold ${budgetVsActual.totalDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(Math.abs(budgetVsActual.totalDifference))}
                        {budgetVsActual.totalDifference < 0 && " over"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Over Budget</p>
                      <p className="text-2xl font-bold text-red-600">{budgetVsActual.overBudgetCount}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Budget Comparison List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y">
                      {budgetVsActual.comparisons.map((comp) => (
                        <div key={comp.categoryId} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className="size-4 rounded-full" style={{ backgroundColor: comp.categoryColor }} />
                              <span className="font-medium">{comp.categoryName}</span>
                              <Badge 
                                variant={comp.status === "over" ? "destructive" : comp.status === "warning" ? "outline" : "secondary"}
                                className="text-[10px]"
                              >
                                {comp.status === "over" ? "Over Budget" : comp.status === "warning" ? "Warning" : "On Track"}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <span className="font-medium">{formatCurrency(comp.actual)}</span>
                              <span className="text-muted-foreground"> / {formatCurrency(comp.budgeted)}</span>
                            </div>
                          </div>
                          <Progress 
                            value={Math.min(comp.percentUsed, 100)} 
                            className="h-2"
                            style={{ ["--progress-color" as string]: comp.status === "over" ? "#ef4444" : comp.status === "warning" ? "#f97316" : "#22c55e" }}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{comp.percentUsed.toFixed(0)}% used</span>
                            <span className={comp.difference >= 0 ? "text-green-600" : "text-red-600"}>
                              {comp.difference >= 0 ? formatCurrency(comp.difference) + " left" : formatCurrency(Math.abs(comp.difference)) + " over"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Tax Summary Tab */}
          <TabsContent value="tax" className="space-y-6">
            {!taxSummary ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
              </div>
            ) : (
              <>
                {/* Tax Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Gross Income</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(taxSummary.totalIncome)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{taxSummary.incomeCount} transactions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(taxSummary.totalExpenses)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{taxSummary.expenseCount} transactions</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Net Profit</p>
                      <p className={`text-2xl font-bold ${taxSummary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(taxSummary.netProfit)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Before taxes</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Income by Category */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Income by Category</CardTitle>
                      <CardDescription>For tax reporting purposes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {taxSummary.incomeByCategory.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No income recorded</p>
                      ) : (
                        <div className="divide-y">
                          {taxSummary.incomeByCategory.map((cat) => (
                            <div key={cat.name} className="flex justify-between py-2 first:pt-0 last:pb-0">
                              <div>
                                <span className="font-medium">{cat.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">({cat.count} transactions)</span>
                              </div>
                              <span className="font-medium text-green-600">{formatCurrency(cat.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Expenses by Category (Potential Deductions) */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Expenses by Category</CardTitle>
                      <CardDescription>Potential deductions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {taxSummary.expenseByCategory.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No expenses recorded</p>
                      ) : (
                        <div className="divide-y">
                          {taxSummary.expenseByCategory.map((cat) => (
                            <div key={cat.name} className="flex justify-between py-2 first:pt-0 last:pb-0">
                              <div>
                                <span className="font-medium">{cat.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">({cat.count} transactions)</span>
                              </div>
                              <span className="font-medium">{formatCurrency(cat.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
