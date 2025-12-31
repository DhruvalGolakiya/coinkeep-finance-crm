"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { format } from "date-fns";

interface RecurringFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRecurring?: {
    _id: Id<"recurringTransactions">;
    accountId: Id<"accounts">;
    type: "income" | "expense";
    amount: number;
    categoryId?: Id<"categories">;
    description: string;
    frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
    nextDueDate: number;
    notes?: string;
  } | null;
  currency: string;
}

export function RecurringForm({ 
  open, 
  onOpenChange, 
  editingRecurring,
  currency 
}: RecurringFormProps) {
  const accounts = useQuery(api.accounts.list);
  const categories = useQuery(api.categories.list);
  
  const createRecurring = useMutation(api.recurring.create);
  const updateRecurring = useMutation(api.recurring.update);
  
  const [accountId, setAccountId] = useState<string>("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly" | "monthly" | "yearly">("monthly");
  const [nextDueDate, setNextDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Filter categories by type
  const filteredCategories = categories?.filter(c => c.type === type);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && editingRecurring) {
      setAccountId(editingRecurring.accountId);
      setType(editingRecurring.type);
      setAmount(editingRecurring.amount.toString());
      setCategoryId(editingRecurring.categoryId || "");
      setDescription(editingRecurring.description);
      setFrequency(editingRecurring.frequency);
      setNextDueDate(format(editingRecurring.nextDueDate, "yyyy-MM-dd"));
      setNotes(editingRecurring.notes || "");
    } else if (!open) {
      setAccountId("");
      setType("expense");
      setAmount("");
      setCategoryId("");
      setDescription("");
      setFrequency("monthly");
      setNextDueDate(format(new Date(), "yyyy-MM-dd"));
      setNotes("");
      setError("");
    }
  }, [open, editingRecurring]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!accountId) {
      setError("Please select an account");
      return;
    }
    
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    setIsLoading(true);
    try {
      if (editingRecurring) {
        await updateRecurring({
          id: editingRecurring._id,
          accountId: accountId as Id<"accounts">,
          type,
          amount: parsedAmount,
          categoryId: categoryId ? categoryId as Id<"categories"> : undefined,
          description: description.trim(),
          frequency,
          nextDueDate: new Date(nextDueDate).getTime(),
          notes: notes.trim() || undefined,
        });
      } else {
        await createRecurring({
          accountId: accountId as Id<"accounts">,
          type,
          amount: parsedAmount,
          categoryId: categoryId ? categoryId as Id<"categories"> : undefined,
          description: description.trim(),
          frequency,
          nextDueDate: new Date(nextDueDate).getTime(),
          notes: notes.trim() || undefined,
        });
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const currencySymbol = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).formatToParts(0).find(part => part.type === "currency")?.value || "$";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingRecurring ? "Edit Recurring Transaction" : "Add Recurring Transaction"}
          </DialogTitle>
          <DialogDescription>
            {editingRecurring 
              ? "Update recurring transaction details" 
              : "Set up a recurring income or expense"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Type
              </label>
              <Select 
                value={type} 
                onValueChange={(v) => {
                  setType(v as typeof type);
                  setCategoryId(""); // Reset category when type changes
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Account
              </label>
              <Select value={accountId} onValueChange={(value) => setAccountId(value ?? "")} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((acc) => (
                    <SelectItem key={acc._id} value={acc._id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </label>
            <Input
              type="text"
              placeholder="e.g., Netflix Subscription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  type="number"
                  placeholder="15.99"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Category
              </label>
              <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? "")} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories?.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="size-3 rounded-sm"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Frequency
              </label>
              <Select 
                value={frequency} 
                onValueChange={(v) => setFrequency(v as typeof frequency)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Next Due Date
              </label>
              <Input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Notes (optional)
            </label>
            <Textarea
              placeholder="Add any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={2}
            />
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <Spinner className="size-4" />
              ) : editingRecurring ? (
                "Save Changes"
              ) : (
                "Add Recurring"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
