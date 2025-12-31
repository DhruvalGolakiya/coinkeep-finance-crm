"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/layout/header";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountForm } from "@/components/accounts/account-form";
import { PayLiabilityForm } from "@/components/accounts/pay-liability-form";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Id } from "@/convex/_generated/dataModel";
import {
  WalletIcon,
  TrendUpIcon,
  TrendDownIcon,
  BankIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ChartLineUpIcon,
  HouseIcon,
} from "@phosphor-icons/react";
import { useFormatCurrency } from "@/lib/format";

type AccountType = "bank" | "credit_card" | "cash" | "investment" | "asset";

interface AccountData {
  _id: Id<"accounts">;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isBusinessAccount: boolean;
  color?: string;
}

const typeConfig: Record<AccountType, { icon: typeof BankIcon; label: string }> = {
  bank: { icon: BankIcon, label: "Bank Accounts" },
  credit_card: { icon: CreditCardIcon, label: "Credit Cards" },
  cash: { icon: CurrencyDollarIcon, label: "Cash" },
  investment: { icon: ChartLineUpIcon, label: "Investments" },
  asset: { icon: HouseIcon, label: "Assets" },
};

export default function AccountsPage() {
  const formatCurrency = useFormatCurrency();
  
  const accounts = useQuery(api.accounts.list);
  const totals = useQuery(api.accounts.getTotalBalance);
  const createAccount = useMutation(api.accounts.create);
  const updateAccount = useMutation(api.accounts.update);
  const deleteAccount = useMutation(api.accounts.remove);
  const createTransaction = useMutation(api.transactions.create);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountData | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"accounts"> | null>(null);
  const [payingLiability, setPayingLiability] = useState<AccountData | null>(null);

  // Get payment source accounts (bank, cash - not liabilities)
  const paymentAccounts = accounts?.filter(
    (a) => a.type === "bank" || a.type === "cash"
  ) ?? [];

  const handleCreate = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const handleEdit = (account: AccountData) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteAccount({ id: deletingId });
      setDeletingId(null);
    }
  };

  const handleSubmit = async (data: {
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
    isBusinessAccount: boolean;
    color?: string;
  }) => {
    if (editingAccount) {
      await updateAccount({ id: editingAccount._id, ...data });
    } else {
      await createAccount(data);
    }
    setIsFormOpen(false);
    setEditingAccount(null);
  };

  const handlePayLiability = async (data: {
    fromAccountId: Id<"accounts">;
    toAccountId: Id<"accounts">;
    amount: number;
    description: string;
  }) => {
    // Create a transfer transaction from bank/cash to liability account
    await createTransaction({
      accountId: data.fromAccountId,
      type: "transfer",
      amount: data.amount,
      toAccountId: data.toAccountId,
      description: data.description,
      date: Date.now(),
      isBusinessExpense: false,
    });
    setPayingLiability(null);
  };

  const isLoading = !accounts;

  // Group accounts by type
  const groupedAccounts = accounts?.reduce((acc, account) => {
    const type = account.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {} as Record<string, typeof accounts>);

  // Calculate distribution for the chart
  const assetTypes = ["bank", "cash", "investment", "asset"];
  const assetBreakdown = accounts
    ?.filter(a => assetTypes.includes(a.type))
    .reduce((acc, account) => {
      const type = account.type;
      acc[type] = (acc[type] || 0) + account.balance;
      return acc;
    }, {} as Record<string, number>) ?? {};

  const totalAssets = Object.values(assetBreakdown).reduce((sum, val) => sum + val, 0);

  // Order of account type sections
  const typeOrder: AccountType[] = ["bank", "credit_card", "cash", "investment", "asset"];

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Accounts"
        subtitle={`${accounts?.length ?? 0} accounts`}
        action={{ label: "Add Account", onClick: handleCreate }}
      />

      <div className="flex-1 overflow-y-auto space-y-6 p-6">
        {/* Hero Stats Section */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Net Worth Card - Hero */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Net Worth</span>
                <Badge variant="secondary">
                  <TrendUpIcon className="size-3" />
                  Overview
                </Badge>
              </CardTitle>
              <CardDescription>Combined balance of all accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!totals ? (
                <Skeleton className="h-12 w-48" />
              ) : (
                <p className="text-4xl font-semibold tracking-tight">
                  {formatCurrency(totals.netWorth)}
                </p>
              )}
              
              {/* Assets vs Liabilities Progress */}
              {totals && totals.assets > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assets vs Liabilities</span>
                    <span className="font-medium">
                      {Math.round((totals.assets / (totals.assets + totals.liabilities)) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.round((totals.assets / (totals.assets + totals.liabilities)) * 100)} 
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assets Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUpIcon className="size-4 text-foreground" />
                Assets
              </CardTitle>
              <CardDescription>Total value</CardDescription>
            </CardHeader>
            <CardContent>
              {!totals ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight">
                  {formatCurrency(totals.assets, { compact: true })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Liabilities Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendDownIcon className="size-4 text-muted-foreground" />
                Liabilities
              </CardTitle>
              <CardDescription>Total owed</CardDescription>
            </CardHeader>
            <CardContent>
              {!totals ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-muted-foreground">
                  {formatCurrency(totals.liabilities, { compact: true })}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Asset Distribution Card */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Asset Distribution</CardTitle>
              <CardDescription>Breakdown by account type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : totalAssets === 0 ? (
                <p className="text-sm text-muted-foreground">No assets yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(assetBreakdown)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 4)
                    .map(([type, amount]) => {
                      const config = typeConfig[type as AccountType];
                      const percentage = Math.round((amount / totalAssets) * 100);
                      return (
                        <div key={type} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <config.icon className="size-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">{config.label}</span>
                            </div>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div 
                              className="h-full bg-foreground transition-all" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Accounts List */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="size-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : accounts?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                <WalletIcon className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-medium">No accounts yet</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                Create your first account to start tracking your finances and managing your money effectively
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {typeOrder.map((type) => {
              const typeAccounts = groupedAccounts?.[type];
              if (!typeAccounts || typeAccounts.length === 0) return null;
              
              const config = typeConfig[type];
              const Icon = config.icon;
              
              return (
                <div key={type}>
                  <div className="mb-4 flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <h2 className="text-sm font-medium text-muted-foreground">
                      {config.label}
                    </h2>
                    <Badge variant="secondary" className="ml-auto">
                      {typeAccounts.length}
                    </Badge>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {typeAccounts.map((account) => (
                      <AccountCard
                        key={account._id}
                        account={account as AccountData}
                        onEdit={() => handleEdit(account as AccountData)}
                        onDelete={() => setDeletingId(account._id)}
                        onPay={
                          account.type === "credit_card"
                            ? () => setPayingLiability(account as AccountData)
                            : undefined
                        }
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Account Form Dialog */}
      <AccountForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        account={editingAccount}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this account? This action cannot be
              undone and will remove all associated transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay Liability Dialog */}
      <PayLiabilityForm
        open={!!payingLiability}
        onOpenChange={(open) => !open && setPayingLiability(null)}
        liabilityAccount={payingLiability}
        paymentAccounts={paymentAccounts as AccountData[]}
        onSubmit={handlePayLiability}
      />
    </div>
  );
}
