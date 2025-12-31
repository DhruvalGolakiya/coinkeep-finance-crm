"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  BankIcon,
  CreditCardIcon,
  WalletIcon,
  TrendUpIcon,
  HouseIcon,
  ReceiptIcon,
  ArrowRightIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface Account {
  _id: string;
  name: string;
  type: "bank" | "credit_card" | "cash" | "investment" | "loan" | "asset";
  balance: number;
  isBusinessAccount: boolean;
  color?: string;
}

interface AccountBalancesProps {
  accounts: Account[];
  isLoading: boolean;
}

const accountTypeConfig = {
  bank: { icon: BankIcon },
  credit_card: { icon: CreditCardIcon },
  cash: { icon: WalletIcon },
  investment: { icon: TrendUpIcon },
  loan: { icon: ReceiptIcon },
  asset: { icon: HouseIcon },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AccountBalances({ accounts, isLoading }: AccountBalancesProps) {
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounts</CardTitle>
        <CardDescription>
          {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/accounts" />}>
            Manage
            <ArrowRightIcon className="size-3.5" />
          </Button>
        </CardAction>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <WalletIcon className="size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              No accounts yet
            </p>
            <Button variant="outline" size="sm" className="mt-4" render={<Link href="/dashboard/accounts" />}>
              <PlusIcon className="size-3.5" />
              Add Account
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {accounts.slice(0, 5).map((account, index) => {
              const config = accountTypeConfig[account.type];
              const Icon = config.icon;
              const isNegative = account.balance < 0;

              return (
                <div key={account._id}>
                  <div className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-muted/50">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-4 text-muted-foreground" weight="bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{account.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                      {account.type.replace("_", " ")}
                        {account.isBusinessAccount && " · Business"}
                      </p>
                    </div>
                    <p className={cn(
                      "text-sm font-medium tabular-nums",
                      isNegative && "text-muted-foreground"
                    )}>
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                  {index < Math.min(accounts.length, 5) - 1 && (
                    <Separator className="ml-14" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      
      {accounts.length > 0 && (
        <CardFooter className="justify-between">
          <span className="text-sm text-muted-foreground">Total Balance</span>
          <span className="text-sm font-semibold">{formatCurrency(totalBalance)}</span>
        </CardFooter>
      )}
    </Card>
  );
}
