"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { CreditCardIcon, ArrowRightIcon } from "@phosphor-icons/react";

type AccountType = "bank" | "credit_card" | "cash" | "investment" | "asset";

interface PayLiabilityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liabilityAccount: {
    _id: Id<"accounts">;
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
  } | null;
  paymentAccounts: Array<{
    _id: Id<"accounts">;
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
  }>;
  onSubmit: (data: {
    fromAccountId: Id<"accounts">;
    toAccountId: Id<"accounts">;
    amount: number;
    description: string;
  }) => void;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function PayLiabilityForm({
  open,
  onOpenChange,
  liabilityAccount,
  paymentAccounts,
  onSubmit,
}: PayLiabilityFormProps) {
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Reset form when opened
  useEffect(() => {
    if (open && liabilityAccount) {
      setFromAccountId(paymentAccounts[0]?._id ?? "");
      // Default to full balance
      setAmount(Math.abs(liabilityAccount.balance).toString());
      setDescription(`Pay ${liabilityAccount.name} bill`);
    }
  }, [open, liabilityAccount, paymentAccounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !liabilityAccount) return;

    onSubmit({
      fromAccountId: fromAccountId as Id<"accounts">,
      toAccountId: liabilityAccount._id,
      amount: parseFloat(amount) || 0,
      description,
    });
  };

  const selectedFromAccount = paymentAccounts.find(a => a._id === fromAccountId);
  const paymentAmount = parseFloat(amount) || 0;
  const hasInsufficientFunds = selectedFromAccount && paymentAmount > selectedFromAccount.balance;

  if (!liabilityAccount) return null;

  const balanceOwed = Math.abs(liabilityAccount.balance);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CreditCardIcon className="size-5" weight="bold" />
            Pay Credit Card
          </AlertDialogTitle>
          <AlertDialogDescription>
            Transfer money to pay off your {liabilityAccount.name}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Current Balance Display */}
          <div className="mb-4 rounded-lg bg-muted/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current Balance Owed
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {formatCurrency(balanceOwed, liabilityAccount.currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              on {liabilityAccount.name}
            </p>
          </div>

          <FieldGroup className="space-y-4">
            {/* Pay From Account */}
            <Field>
              <FieldLabel htmlFor="pay-from">Pay From</FieldLabel>
              <Select
                value={fromAccountId}
                onValueChange={(v) => v && setFromAccountId(v)}
                items={paymentAccounts.map(a => ({ value: a._id, label: a.name }))}
              >
                <SelectTrigger id="pay-from">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {paymentAccounts.map((a) => (
                      <SelectItem key={a._id} value={a._id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{a.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(a.balance, a.currency)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {hasInsufficientFunds && (
                <p className="text-xs text-destructive mt-1">
                  Insufficient funds in this account
                </p>
              )}
            </Field>

            {/* Amount */}
            <Field>
              <FieldLabel htmlFor="pay-amount">Amount to Pay</FieldLabel>
              <Input
                id="pay-amount"
                type="number"
                step="0.01"
                min="0"
                max={balanceOwed}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(balanceOwed.toString())}
                >
                  Pay Full
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount((balanceOwed / 2).toFixed(2))}
                >
                  Pay Half
                </Button>
              </div>
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel htmlFor="pay-description">Description</FieldLabel>
              <Input
                id="pay-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Payment description"
                required
              />
            </Field>
          </FieldGroup>

          {/* Transfer Preview */}
          {selectedFromAccount && paymentAmount > 0 && (
            <div className="mt-4 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Transfer Preview</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{selectedFromAccount.name}</span>
                <ArrowRightIcon className="size-4 text-muted-foreground" />
                <span className="font-medium">{liabilityAccount.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(paymentAmount, liabilityAccount.currency)} will be transferred
              </p>
            </div>
          )}

          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button 
              type="submit" 
              disabled={hasInsufficientFunds || paymentAmount <= 0}
            >
              Pay {formatCurrency(paymentAmount, liabilityAccount.currency)}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
