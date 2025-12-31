"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { SpendingBreakdown } from "@/components/dashboard/spending-breakdown";
import { BudgetProgress } from "@/components/dashboard/budget-progress";
import { GoalsProgress } from "@/components/dashboard/goals-progress";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user } = useAuth();
  const stats = useQuery(api.analytics.getDashboardStats);
  const trends = useQuery(api.analytics.getMonthlyTrends, { months: 6 });
  const recentTransactions = useQuery(api.analytics.getRecentTransactions, {
    limit: 6,
  });
  const accounts = useQuery(api.accounts.list);
  const seedCategories = useMutation(api.categories.seedDefaults);

  useEffect(() => {
    seedCategories();
  }, [seedCategories]);

  const isLoading = !stats || !trends || !recentTransactions || !accounts;

  // Show goals widget for personal and freelancer use cases
  const showGoals = !user?.useCase || user.useCase === "personal" || user.useCase === "freelancer";

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <StatsCards stats={stats} isLoading={isLoading} />

        <div className="grid gap-4 lg:grid-cols-3">
          <CashFlowChart
            data={trends ?? []}
            isLoading={isLoading}
            className="lg:col-span-2"
          />
          <SpendingBreakdown />
        </div>

        {/* Budget & Goals Widgets */}
        <div className={`grid gap-4 ${showGoals ? "sm:grid-cols-2" : ""}`}>
          <BudgetProgress currency={user?.currency || "USD"} />
          {showGoals && (
            <GoalsProgress currency={user?.currency || "USD"} />
          )}
        </div>

        <RecentTransactions
          transactions={recentTransactions ?? []}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
