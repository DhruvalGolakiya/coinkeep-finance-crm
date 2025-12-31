"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface BusinessPersonalChartProps {
  data?: {
    business: {
      income: number;
      expenses: number;
      net: number;
    };
    personal: {
      income: number;
      expenses: number;
      net: number;
    };
  };
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value}`;
}

export function BusinessPersonalChart({
  data,
  isLoading,
}: BusinessPersonalChartProps) {
  if (isLoading || !data) {
    return (
      <div className="flex h-[250px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const chartData = [
    {
      name: "Business",
      income: data.business.income,
      expenses: data.business.expenses,
    },
    {
      name: "Personal",
      income: data.personal.income,
      expenses: data.personal.expenses,
    },
  ];

  const hasData =
    data.business.income > 0 ||
    data.business.expenses > 0 ||
    data.personal.income > 0 ||
    data.personal.expenses > 0;

  if (!hasData) {
    return (
      <div className="flex h-[250px] items-center justify-center text-muted-foreground">
        No transactions this month.
      </div>
    );
  }

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={false}
          />
          <XAxis
            type="number"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatCurrency}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            width={70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]}
          />
          <Legend />
          <Bar
            dataKey="income"
            name="Income"
            fill="hsl(249, 73%, 62%)"
            radius={[0, 4, 4, 0]}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="hsl(35, 32%, 50%)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Business Net</p>
          <p
            className={`text-sm font-semibold ${
              data.business.net >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {data.business.net >= 0 ? "+" : ""}
            {formatCurrency(data.business.net)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Personal Net</p>
          <p
            className={`text-sm font-semibold ${
              data.personal.net >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {data.personal.net >= 0 ? "+" : ""}
            {formatCurrency(data.personal.net)}
          </p>
        </div>
      </div>
    </div>
  );
}

