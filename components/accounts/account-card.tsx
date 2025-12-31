"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BankIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ChartLineUpIcon,
  HouseIcon,
  DotsThreeVerticalIcon,
  PencilIcon,
  TrashIcon,
  BuildingsIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type AccountType = "bank" | "credit_card" | "cash" | "investment" | "asset";

interface AccountCardProps {
  account: {
    _id: string;
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
    isBusinessAccount: boolean;
    color?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onPay?: () => void;
}

const accountTypeConfig: Record<AccountType, { icon: typeof BankIcon; label: string }> = {
  bank: { icon: BankIcon, label: "Bank Account" },
  credit_card: { icon: CreditCardIcon, label: "Credit Card" },
  cash: { icon: CurrencyDollarIcon, label: "Cash" },
  investment: { icon: ChartLineUpIcon, label: "Investment" },
  asset: { icon: HouseIcon, label: "Asset" },
};

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function AccountCard({ account, onEdit, onDelete, onPay }: AccountCardProps) {
  const config = accountTypeConfig[account.type];
  const Icon = config.icon;
  const isLiability = account.type === "credit_card";
  const hasBalance = Math.abs(account.balance) > 0;

  return (
    <Card className="group relative transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-4 text-muted-foreground" weight="bold" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{account.name}</h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">{config.label}</span>
                {account.isBusinessAccount && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] gap-0.5">
                    <BuildingsIcon className="size-2.5" weight="bold" />
                    Business
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
                />
              }
            >
              <DotsThreeVerticalIcon className="size-4" weight="bold" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} variant="destructive">
                <TrashIcon className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-5 pt-4 border-t border-border">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {isLiability ? "Balance Owed" : "Current Balance"}
              </p>
              <p
                className={cn(
                  "mt-1 text-xl font-semibold tracking-tight tabular-nums",
                  isLiability ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {formatCurrency(Math.abs(account.balance), account.currency)}
              </p>
            </div>
            {/* Pay button for liability accounts with balance */}
            {isLiability && hasBalance && onPay && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPay}
                className="text-xs"
              >
                Pay
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
