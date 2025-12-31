"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useFormatCurrency } from "@/lib/format";

interface CategoryPieChartProps {
  data: Array<{
    id: string;
    name: string;
    amount: number;
    color: string;
  }>;
  isLoading: boolean;
  type: "income" | "expense";
}

export function CategoryPieChart({
  data,
  isLoading,
  type,
}: CategoryPieChartProps) {
  const formatCurrency = useFormatCurrency();

  if (isLoading) {
    return (
      <div className="flex h-[280px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-muted-foreground">
        No {type} transactions this month.
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.id} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [formatCurrency(Number(value)), ""]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value, entry) => {
              const item = data.find((d) => d.name === value);
              if (!item) return value;
              const percentage = ((item.amount / total) * 100).toFixed(1);
              return (
                <span className="text-xs">
                  {value} ({percentage}%)
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Total */}
      <div className="mt-2 text-center">
        <p className="text-xs text-muted-foreground">
          Total {type === "income" ? "Income" : "Expenses"}
        </p>
        <p
          className={`text-lg font-bold ${
            type === "income" ? "text-primary" : "text-destructive"
          }`}
        >
          {formatCurrency(total)}
        </p>
      </div>
    </div>
  );
}

