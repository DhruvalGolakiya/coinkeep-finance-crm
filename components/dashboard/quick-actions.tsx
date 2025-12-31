"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  ArrowsLeftRightIcon,
  FileTextIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";

const actions = [
  {
    label: "Income",
    href: "/dashboard/transactions",
    icon: ArrowDownLeftIcon,
  },
  {
    label: "Expense",
    href: "/dashboard/transactions",
    icon: ArrowUpRightIcon,
  },
  {
    label: "Transfer",
    href: "/dashboard/transactions",
    icon: ArrowsLeftRightIcon,
  },
  {
    label: "Invoice",
    href: "/dashboard/invoices",
    icon: FileTextIcon,
  },
  {
    label: "Client",
    href: "/dashboard/clients",
    icon: UserPlusIcon,
  },
  {
    label: "Account",
    href: "/dashboard/accounts",
    icon: PlusIcon,
  },
];

export function QuickActions() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border p-4">
        <h3 className="text-sm font-medium">Quick Actions</h3>
        <p className="text-[11px] text-muted-foreground">Create new items</p>
      </div>
      <div className="grid grid-cols-3 gap-px">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            className="h-auto flex-col gap-1.5 rounded-none bg-card py-4 hover:bg-muted/50"
            render={<Link href={action.href} />}
          >
            <action.icon className="size-4 text-muted-foreground" />
            <span className="text-[10px] font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
