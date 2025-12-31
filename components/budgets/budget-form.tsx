"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface BudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBudget?: {
    _id: Id<"budgets">;
    categoryId: Id<"categories">;
    amount: number;
    period: "weekly" | "monthly" | "yearly";
  } | null;
  currency: string;
}

export function BudgetForm({ 
  open, 
  onOpenChange, 
  editingBudget,
  currency 
}: BudgetFormProps) {
  const categories = useQuery(api.categories.getByType, { type: "expense" });
  const existingBudgets = useQuery(api.budgets.list);
  
  const createBudget = useMutation(api.budgets.create);
  const updateBudget = useMutation(api.budgets.update);
  
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when dialog opens/closes or when editing budget changes
  useEffect(() => {
    if (open && editingBudget) {
      setCategoryId(editingBudget.categoryId);
      setAmount(editingBudget.amount.toString());
      setPeriod(editingBudget.period);
    } else if (!open) {
      setCategoryId("");
      setAmount("");
      setPeriod("monthly");
      setError("");
    }
  }, [open, editingBudget]);

  // Filter out categories that already have budgets (unless editing)
  const availableCategories = categories?.filter(cat => {
    if (editingBudget && cat._id === editingBudget.categoryId) return true;
    return !existingBudgets?.some(b => b.categoryId === cat._id);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!categoryId) {
      setError("Please select a category");
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    setIsLoading(true);
    try {
      if (editingBudget) {
        await updateBudget({
          id: editingBudget._id,
          amount: parsedAmount,
          period,
        });
      } else {
        await createBudget({
          categoryId: categoryId as Id<"categories">,
          amount: parsedAmount,
          period,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingBudget ? "Edit Budget" : "Create Budget"}
          </DialogTitle>
          <DialogDescription>
            {editingBudget 
              ? "Update your budget settings" 
              : "Set a spending limit for a category"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Category
            </label>
            <Select 
              value={categoryId} 
              onValueChange={(v) => setCategoryId(v ?? "")}
              disabled={!!editingBudget || isLoading}
            >
              <SelectTrigger className="w-full">
                {categoryId ? (
                  <div className="flex items-center gap-2">
                    <div 
                      className="size-3 rounded-sm"
                      style={{ backgroundColor: availableCategories?.find(c => c._id === categoryId)?.color }}
                    />
                    {availableCategories?.find(c => c._id === categoryId)?.name}
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select category</span>
                )}
              </SelectTrigger>
              <SelectContent>
                {availableCategories?.map((cat) => (
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
                {availableCategories?.length === 0 && (
                  <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                    All categories have budgets
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Budget Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {currencySymbol}
              </span>
              <Input
                type="number"
                placeholder="500"
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
              Period
            </label>
            <Select 
              value={period} 
              onValueChange={(v) => setPeriod(v as typeof period)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {period === "weekly" && "Budget resets every week on Monday"}
              {period === "monthly" && "Budget resets on the 1st of each month"}
              {period === "yearly" && "Budget resets at the start of your fiscal year"}
            </p>
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
              ) : editingBudget ? (
                "Save Changes"
              ) : (
                "Create Budget"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
