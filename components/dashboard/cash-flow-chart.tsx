"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DotsThreeIcon } from "@phosphor-icons/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  CartesianGrid,
  TooltipProps,
} from "recharts";
import { useFormatCurrency, useCurrencySymbol } from "@/lib/format";

interface CashFlowChartProps {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  isLoading: boolean;
  className?: string;
}

export function CashFlowChart({ data, isLoading, className }: CashFlowChartProps) {
  const [period, setPeriod] = useState("monthly");
  const formatCurrency = useFormatCurrency();
  const currencySymbol = useCurrencySymbol();

  const formatAxisValue = (value: number): string => {
    if (Math.abs(value) >= 1000) {
      return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
    }
    return `${currencySymbol}${value}`;
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;

    const income = payload.find(p => p.dataKey === "income")?.value ?? 0;
    const expenses = payload.find(p => p.dataKey === "expenses")?.value ?? 0;

    return (
      <div className="rounded-lg border border-border bg-popover px-4 py-3 shadow-lg">
        <p className="mb-2 text-sm font-medium">{label}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-foreground" />
              <span className="text-xs text-muted-foreground">Income</span>
            </div>
            <span className="text-xs font-medium">{formatCurrency(Number(income))}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-muted-foreground" />
              <span className="text-xs text-muted-foreground">Expense</span>
            </div>
            <span className="text-xs font-medium">{formatCurrency(Number(expenses))}</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Find the current/latest month for the highlight
  const currentMonthIndex = data.length > 0 ? data.length - 1 : 0;
  const highlightMonth = data[currentMonthIndex]?.month;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Cash Flow Projection</CardTitle>
        <CardAction className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <DotsThreeIcon className="size-5" weight="bold" />
          </Button>
        </CardAction>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex h-[280px] items-center justify-center">
            <Skeleton className="size-8 rounded-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={data} 
                margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid 
                  horizontalPoints={[]}
                  strokeDasharray="3 3"
                  stroke="currentColor"
                  className="text-border"
                />
                {/* Highlight area for current period */}
                {highlightMonth && (
                  <ReferenceArea
                    x1={highlightMonth}
                    x2={highlightMonth}
                    fill="var(--primary)"
                    fillOpacity={0.1}
                  />
                )}
                <XAxis
                  dataKey="month"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={12}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatAxisValue}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                  width={50}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ 
                    stroke: "var(--primary)", 
                    strokeWidth: 1,
                    strokeDasharray: "4 4"
                  }}
                />
                {/* Income line - solid */}
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="var(--foreground)"  
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: "var(--foreground)",
                    stroke: "var(--background)",
                    strokeWidth: 2
                  }}
                  name="Income"
                />
                {/* Expenses line - dashed */}
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="var(--muted-foreground)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: "hsl(var(--muted-foreground))",
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2
                  }}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

