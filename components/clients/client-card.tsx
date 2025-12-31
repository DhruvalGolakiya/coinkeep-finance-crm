"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingsIcon,
  DotsThreeVerticalIcon,
  PencilIcon,
  TrashIcon,
  FileTextIcon,
} from "@phosphor-icons/react";

interface ClientCardProps {
  client: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    currency?: string;
    invoiceCount?: number;
    totalBilled?: number;
    outstanding?: number;
  };
  onEdit: () => void;
  onDelete: () => void;
}

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  const currency = client.currency || "USD";

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{client.name}</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {currency}
                </Badge>
              </div>
              {client.company && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BuildingsIcon className="h-3 w-3" />
                  {client.company}
                </p>
              )}
            </div>
          </div>

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
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/dashboard/invoices" />}>
                <FileTextIcon className="mr-2 h-4 w-4" />
                Create Invoice
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} variant="destructive">
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact Info */}
        <div className="mt-4 space-y-1.5">
          {client.email && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <EnvelopeIcon className="h-3.5 w-3.5" />
              {client.email}
            </p>
          )}
          {client.phone && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <PhoneIcon className="h-3.5 w-3.5" />
              {client.phone}
            </p>
          )}
        </div>

        {/* Invoice Stats */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs text-muted-foreground">Invoices</p>
            <p className="text-sm font-medium">{client.invoiceCount ?? 0}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Billed</p>
            <p className="text-sm font-medium">
              {formatCurrency(client.totalBilled ?? 0, currency)}
            </p>
          </div>
          {(client.outstanding ?? 0) > 0 && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="text-sm font-medium text-secondary">
                {formatCurrency(client.outstanding ?? 0, currency)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

