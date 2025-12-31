"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon, ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { Id } from "@/convex/_generated/dataModel";

type TransactionType = "income" | "expense" | "transfer";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionType;
  onTypeChange: (type: TransactionType) => void;
  accounts: Array<{ _id: Id<"accounts">; name: string; type: string }>;
  categories: Array<{ _id: Id<"categories">; name: string; type: string }>;
  onSubmit: (data: {
    accountId: Id<"accounts">;
    type: TransactionType;
    amount: number;
    categoryId?: Id<"categories">;
    description: string;
    date: number;
    isBusinessExpense: boolean;
    toAccountId?: Id<"accounts">;
    notes?: string;
  }) => void;
}

export function TransactionForm({
  open,
  onOpenChange,
  type,
  onTypeChange,
  accounts,
  categories,
  onSubmit,
}: TransactionFormProps) {
  const [accountId, setAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isBusinessExpense, setIsBusinessExpense] = useState(false);
  const [notes, setNotes] = useState("");

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setAccountId(accounts[0]?._id ?? "");
      setToAccountId("");
      setAmount("");
      setCategoryId("");
      setDescription("");
      setDate(new Date().toISOString().split("T")[0]);
      setIsBusinessExpense(false);
      setNotes("");
    }
  }, [open, accounts]);

  // Filter categories based on type
  const filteredCategories = categories.filter(
    (c) => c.type === (type === "transfer" ? "expense" : type)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;

    onSubmit({
      accountId: accountId as Id<"accounts">,
      type,
      amount: parseFloat(amount) || 0,
      categoryId: categoryId ? (categoryId as Id<"categories">) : undefined,
      description,
      date: new Date(date).getTime(),
      isBusinessExpense,
      toAccountId: toAccountId ? (toAccountId as Id<"accounts">) : undefined,
      notes: notes || undefined,
    });
  };

  const typeButtons = [
    { type: "income" as const, icon: ArrowUpIcon, label: "Income", color: "primary" },
    { type: "expense" as const, icon: ArrowDownIcon, label: "Expense", color: "destructive" },
    { type: "transfer" as const, icon: ArrowsLeftRightIcon, label: "Transfer", color: "secondary" },
  ];

  const accountItems = accounts.map((a) => ({
    value: a._id,
    label: a.name,
  }));

  const categoryItems = [
    { value: "", label: "No category" },
    ...filteredCategories.map((c) => ({
      value: c._id,
      label: c.name,
    })),
  ];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Add Transaction</AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Type Selector */}
          <div className="mb-4 flex gap-2">
            {typeButtons.map((btn) => (
              <button
                key={btn.type}
                type="button"
                onClick={() => onTypeChange(btn.type)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors",
                  type === btn.type
                    ? btn.color === "primary"
                      ? "border-primary bg-primary/10 text-primary"
                      : btn.color === "destructive"
                      ? "border-destructive bg-destructive/10 text-destructive"
                      : "border-secondary bg-secondary-soft text-secondary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                )}
              >
                <btn.icon className="h-4 w-4" weight="bold" />
                {btn.label}
              </button>
            ))}
          </div>

          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="tx-amount">Amount</FieldLabel>
                <Input
                  id="tx-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="tx-date">Date</FieldLabel>
                <Input
                  id="tx-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="tx-description">Description</FieldLabel>
              <Input
                id="tx-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === "income"
                    ? "e.g., Salary payment"
                    : type === "expense"
                    ? "e.g., Grocery shopping"
                    : "e.g., Transfer to savings"
                }
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="tx-account">
                  {type === "transfer" ? "From Account" : "Account"}
                </FieldLabel>
                <Select
                  value={accountId}
                  onValueChange={(v) => v && setAccountId(v)}
                  items={accountItems}
                >
                  <SelectTrigger id="tx-account">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {accounts.map((a) => (
                        <SelectItem key={a._id} value={a._id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {/* Context hint for credit card accounts */}
                {accounts.find(a => a._id === accountId)?.type === "credit_card" && (
                  <p className={`text-[10px] mt-1 ${type === "income" ? "text-amber-600" : "text-muted-foreground"}`}>
                    {type === "income" 
                      ? "⚠️ Rare: Only use for refunds or cashback credits. Most CC transactions should be Expenses." 
                      : type === "expense" 
                        ? "💳 CC purchase = counts as a real expense and increases your debt"
                        : "🔄 Transfer from Bank → CC to pay your bill (reduces debt, not counted as expense)"}
                  </p>
                )}
              </Field>

              {type === "transfer" ? (
                <Field>
                  <FieldLabel htmlFor="tx-to-account">To Account</FieldLabel>
                  <Select
                    value={toAccountId}
                    onValueChange={(v) => v && setToAccountId(v)}
                    items={accountItems.filter((a) => a.value !== accountId)}
                  >
                    <SelectTrigger id="tx-to-account">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {accounts
                          .filter((a) => a._id !== accountId)
                          .map((a) => (
                            <SelectItem key={a._id} value={a._id}>
                              {a.name}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              ) : (
                <Field>
                  <FieldLabel htmlFor="tx-category">Category</FieldLabel>
                  <Select
                    value={categoryId}
                    onValueChange={(v) => setCategoryId(v ?? "")}
                    items={categoryItems}
                  >
                    <SelectTrigger id="tx-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="">No category</SelectItem>
                        {filteredCategories.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>

            <Field>
              <FieldLabel htmlFor="tx-notes">Notes (optional)</FieldLabel>
              <Textarea
                id="tx-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </Field>

            <Field orientation="horizontal">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isBusinessExpense}
                  onChange={(e) => setIsBusinessExpense(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">This is a business transaction</span>
              </label>
            </Field>
          </FieldGroup>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button
              type="submit"
              className={cn(
                type === "income" && "bg-primary hover:bg-primary/90",
                type === "expense" && "bg-destructive hover:bg-destructive/90",
                type === "transfer" && "bg-secondary hover:bg-secondary/90"
              )}
            >
              Add {type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

