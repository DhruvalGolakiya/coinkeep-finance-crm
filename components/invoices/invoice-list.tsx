"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DotsThreeVerticalIcon,
  EyeIcon,
  CheckCircleIcon,
  PaperPlaneTiltIcon,
  TrashIcon,
  PencilIcon,
} from "@phosphor-icons/react";
import { Id } from "@/convex/_generated/dataModel";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

interface Invoice {
  _id: Id<"invoices">;
  clientId: Id<"clients">;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency?: string;
  total: number;
  subtotal: number;
  tax: number;
  taxRate: number;
  issueDate: number;
  dueDate: number;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  notes?: string;
  client?: { name: string; email?: string; address?: string } | null;
}

interface InvoiceListProps {
  invoices: Invoice[];
  onPreview: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onStatusChange: (id: Id<"invoices">, status: InvoiceStatus) => void;
  onMarkAsPaid: (id: Id<"invoices">, total: number, currency: string) => void;
  onDelete: (id: Id<"invoices">) => void;
}

const statusConfig: Record<
  InvoiceStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Draft", color: "text-muted-foreground", bgColor: "bg-muted" },
  sent: { label: "Sent", color: "text-primary", bgColor: "bg-primary-soft" },
  paid: { label: "Paid", color: "text-primary", bgColor: "bg-primary/10" },
  overdue: { label: "Overdue", color: "text-destructive", bgColor: "bg-destructive/10" },
};

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
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

export function InvoiceList({
  invoices,
  onPreview,
  onEdit,
  onStatusChange,
  onMarkAsPaid,
  onDelete,
}: InvoiceListProps) {
  return (
    <div className="rounded-lg border border-border">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 border-b border-border bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground">
        <div className="col-span-2">Invoice</div>
        <div className="col-span-3">Client</div>
        <div className="col-span-2">Issue Date</div>
        <div className="col-span-2">Due Date</div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1 text-right">Amount</div>
        <div className="col-span-1"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {invoices.map((invoice) => {
          const config = statusConfig[invoice.status];
          const isOverdue =
            invoice.status === "sent" && invoice.dueDate < Date.now();

          return (
            <div
              key={invoice._id}
              className="group grid grid-cols-12 items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              {/* Invoice Number */}
              <div className="col-span-2">
                <p className="font-mono text-sm font-medium">
                  {invoice.invoiceNumber}
                </p>
              </div>

              {/* Client */}
              <div className="col-span-3">
                <p className="truncate text-sm">
                  {invoice.client?.name ?? "Unknown Client"}
                </p>
              </div>

              {/* Issue Date */}
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">
                  {formatDate(invoice.issueDate)}
                </p>
              </div>

              {/* Due Date */}
              <div className="col-span-2">
                <p
                  className={`text-sm ${
                    isOverdue ? "text-rose-500 font-medium" : "text-muted-foreground"
                  }`}
                >
                  {formatDate(invoice.dueDate)}
                </p>
              </div>

              {/* Status */}
              <div className="col-span-1">
                <Badge
                  variant="secondary"
                  className={`${config.bgColor} ${config.color}`}
                >
                  {config.label}
                </Badge>
              </div>

              {/* Amount */}
              <div className="col-span-1 text-right">
                <p className="text-sm font-semibold">
                  {formatCurrency(invoice.total, invoice.currency)}
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
                    <DropdownMenuItem onClick={() => onPreview(invoice)}>
                      <EyeIcon className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>

                    {invoice.status === "draft" && (
                      <>
                        <DropdownMenuItem onClick={() => onEdit(invoice)}>
                          <PencilIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(invoice._id, "sent")}
                        >
                          <PaperPlaneTiltIcon className="mr-2 h-4 w-4" />
                          Mark as Sent
                        </DropdownMenuItem>
                      </>
                    )}

                    {(invoice.status === "sent" || invoice.status === "overdue") && (
                      <DropdownMenuItem
                        onClick={() => onMarkAsPaid(invoice._id, invoice.total, invoice.currency || "USD")}
                      >
                        <CheckCircleIcon className="mr-2 h-4 w-4" />
                        Record Payment
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => onDelete(invoice._id)}
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

