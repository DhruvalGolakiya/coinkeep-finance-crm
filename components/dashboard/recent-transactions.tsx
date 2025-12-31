"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  ArrowsLeftRightIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useFormatCurrency, useFormatRelativeDate } from "@/lib/format";

interface Transaction {
  _id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  date: number;
  account?: { name: string } | null;
  category?: { name: string; color: string } | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const typeConfig = {
  income: {
    icon: ArrowDownLeftIcon,
    label: "Income",
    prefix: "+",
  },
  expense: {
    icon: ArrowUpRightIcon,
    label: "Expense",
    prefix: "-",
  },
  transfer: {
    icon: ArrowsLeftRightIcon,
    label: "Transfer",
    prefix: "",
  },
};

export function RecentTransactions({
  transactions,
  isLoading,
}: RecentTransactionsProps) {
  const formatCurrency = useFormatCurrency();
  const formatDate = useFormatRelativeDate();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest transactions across all accounts</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" render={<Link href="/dashboard/transactions" />}>
            View all
            <ArrowRightIcon className="size-3.5" />
          </Button>
        </CardAction>
      </CardHeader>
      
      <CardContent className="px-0">
        {isLoading ? (
          <div className="px-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <ArrowsLeftRightIcon className="size-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              No transactions yet
            </p>
            <Button variant="outline" size="sm" className="mt-4" render={<Link href="/dashboard/transactions" />}>
              Add Transaction
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right pr-4">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
            {transactions.map((transaction) => {
              const config = typeConfig[transaction.type];
              const Icon = config.icon;

              return (
                  <TableRow key={transaction._id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon className="size-3.5 text-muted-foreground" />
                  </div>
                        <span className="font-medium truncate max-w-[200px]">
                      {transaction.description}
                        </span>
                  </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {transaction.account?.name ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transaction.category ? (
                        <Badge variant="secondary">
                          {transaction.category.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{formatDate(transaction.date)}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(transaction.date)}
                        </span>
                  </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <span className={cn(
                        "font-medium tabular-nums",
                        transaction.type === "income" && "text-foreground",
                        transaction.type === "expense" && "text-muted-foreground"
                      )}>
                        {config.prefix}{formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                  </TableRow>
              );
            })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
