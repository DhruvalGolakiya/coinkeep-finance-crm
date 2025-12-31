"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsLeftRightIcon,
  DotsThreeVerticalIcon,
  TrashIcon,
  PencilIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface Transaction {
  _id: Id<"transactions">;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  date: number;
  isBusinessExpense: boolean;
  categoryId?: Id<"categories">;
  notes?: string;
  account?: { name: string } | null;
  category?: { name: string; color: string } | null;
  toAccount?: { name: string } | null;
}

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: Id<"transactions">) => void;
}

const typeConfig = {
  income: {
    icon: ArrowUpIcon,
    color: "text-primary",
    bgColor: "bg-primary/10",
    prefix: "+",
  },
  expense: {
    icon: ArrowDownIcon,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    prefix: "-",
  },
  transfer: {
    icon: ArrowsLeftRightIcon,
    color: "text-secondary",
    bgColor: "bg-secondary-soft",
    prefix: "",
  },
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  return (
    <div className="rounded-lg border border-border">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 border-b border-border bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
        <div className="col-span-5">Description</div>
        <div className="col-span-2">Account</div>
        <div className="col-span-2">Category</div>
        <div className="col-span-2 text-right">Amount</div>
        <div className="col-span-1"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {transactions.map((transaction) => {
          const config = typeConfig[transaction.type];
          const Icon = config.icon;

          return (
            <div
              key={transaction._id}
              className="group grid grid-cols-12 items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              {/* Description */}
              <div className="col-span-5 flex items-center gap-3">
                <div className={cn("rounded-lg p-2", config.bgColor)}>
                  <Icon className={cn("h-4 w-4", config.color)} weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {transaction.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(transaction.date)}</span>
                    {transaction.isBusinessExpense && (
                      <Badge variant="secondary" className="text-[10px]">
                        Business
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Account */}
              <div className="col-span-2">
                <p className="truncate text-sm">
                  {transaction.account?.name ?? "Unknown"}
                </p>
                {transaction.type === "transfer" && transaction.toAccount && (
                  <p className="text-xs text-muted-foreground">
                    → {transaction.toAccount.name}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="col-span-2">
                {transaction.category ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: transaction.category.color }}
                    />
                    <span className="truncate text-sm">
                      {transaction.category.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>

              {/* Amount */}
              <div className="col-span-2 text-right">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    transaction.type === "income"
                      ? "text-emerald-500"
                      : transaction.type === "expense"
                      ? "text-rose-500"
                      : "text-foreground"
                  )}
                >
                  {config.prefix}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                    />}
                  >
                    <DotsThreeVerticalIcon className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(transaction)}>
                      <PencilIcon className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(transaction._id)}
                      variant="destructive"
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

