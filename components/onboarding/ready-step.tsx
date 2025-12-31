"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Confetti,
  ArrowRight,
  Wallet,
  Repeat,
  Target,
  CheckCircle,
  ChartLineUp,
  Plus,
  ArrowLeft,
} from "@phosphor-icons/react";

interface ReadyStepProps {
  accountsCount: number;
  recurringCount: number;
  goalsCount: number;
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  currencySymbol: string;
  onFinish: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function ReadyStep({
  accountsCount,
  recurringCount,
  goalsCount,
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  currencySymbol,
  onFinish,
  onBack,
  isLoading,
}: ReadyStepProps) {
  const formatAmount = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString()}`;
  };

  const hasSetupData = accountsCount > 0 || recurringCount > 0 || goalsCount > 0;
  const netMonthly = monthlyIncome - monthlyExpenses;

  return (
    <Card className="border-0 ring-0 shadow-none bg-transparent text-center">
      <CardHeader className="pb-6">
        <div className="mx-auto mb-4 size-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Confetti className="size-8 text-primary" weight="duotone" />
        </div>
        <CardTitle className="text-2xl">You&apos;re All Set!</CardTitle>
        <CardDescription className="text-base max-w-sm mx-auto">
          {hasSetupData 
            ? "Your financial dashboard is ready. Here's what we set up for you."
            : "Your account is ready. You can add accounts and transactions anytime."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasSetupData && (
          <>
            {/* Summary Grid */}
            <div className="grid grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-muted/50 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="size-4 text-primary" weight="duotone" />
                  <span className="text-xs text-muted-foreground">Accounts</span>
                </div>
                <p className="text-2xl font-semibold">{accountsCount}</p>
                {totalBalance !== 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatAmount(totalBalance)} total
                  </p>
                )}
              </div>
              
              <div className="p-4 bg-muted/50 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Repeat className="size-4 text-primary" weight="duotone" />
                  <span className="text-xs text-muted-foreground">Recurring</span>
                </div>
                <p className="text-2xl font-semibold">{recurringCount}</p>
                {(monthlyIncome > 0 || monthlyExpenses > 0) && (
                  <p className={`text-xs mt-1 ${netMonthly >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {netMonthly >= 0 ? "+" : ""}{formatAmount(netMonthly)}/mo
                  </p>
                )}
              </div>
              
              <div className="p-4 bg-muted/50 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="size-4 text-primary" weight="duotone" />
                  <span className="text-xs text-muted-foreground">Goals</span>
                </div>
                <p className="text-2xl font-semibold">{goalsCount}</p>
              </div>
            </div>

            {/* Monthly Summary */}
            {(monthlyIncome > 0 || monthlyExpenses > 0) && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm text-left">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ChartLineUp className="size-4 text-primary" />
                  Monthly Overview
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Income</p>
                    <p className="font-medium text-green-600">+{formatAmount(monthlyIncome)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Expenses</p>
                    <p className="font-medium text-red-600">-{formatAmount(monthlyExpenses)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Net</p>
                    <p className={`font-medium ${netMonthly >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {netMonthly >= 0 ? "+" : ""}{formatAmount(netMonthly)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* What's Next */}
        <div className="text-left space-y-2">
          <h4 className="text-sm font-medium">What&apos;s next?</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="size-4 text-primary" weight="fill" />
              <span>Track your daily transactions</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="size-4 text-primary" weight="fill" />
              <span>Set budgets to control spending</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <CheckCircle className="size-4 text-primary" weight="fill" />
              <span>View reports and insights</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-10"
            disabled={isLoading}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            onClick={onFinish}
            className="flex-1 h-10 gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <>
                <span>Go to Dashboard</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
