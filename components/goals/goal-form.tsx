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
import { format } from "date-fns";

const GOAL_COLORS = [
  { value: "#6366f1", label: "Indigo" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#ef4444", label: "Red" },
  { value: "#f97316", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#22c55e", label: "Green" },
  { value: "#14b8a6", label: "Teal" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#6b7280", label: "Gray" },
];

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGoal?: {
    _id: Id<"goals">;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: number;
    linkedAccountId?: Id<"accounts">;
    color?: string;
  } | null;
  currency: string;
}

export function GoalForm({ 
  open, 
  onOpenChange, 
  editingGoal,
  currency 
}: GoalFormProps) {
  const accounts = useQuery(api.accounts.list);
  
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState<string>("");
  const [color, setColor] = useState("#6366f1");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && editingGoal) {
      setName(editingGoal.name);
      setTargetAmount(editingGoal.targetAmount.toString());
      setCurrentAmount(editingGoal.currentAmount.toString());
      setTargetDate(editingGoal.targetDate ? format(editingGoal.targetDate, "yyyy-MM-dd") : "");
      setLinkedAccountId(editingGoal.linkedAccountId || "");
      setColor(editingGoal.color || "#6366f1");
    } else if (!open) {
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setTargetDate("");
      setLinkedAccountId("");
      setColor("#6366f1");
      setError("");
    }
  }, [open, editingGoal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!name.trim()) {
      setError("Please enter a goal name");
      return;
    }
    
    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError("Please enter a valid target amount");
      return;
    }
    
    const parsedCurrent = currentAmount ? parseFloat(currentAmount) : 0;
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      setError("Please enter a valid current amount");
      return;
    }
    
    setIsLoading(true);
    try {
      if (editingGoal) {
        await updateGoal({
          id: editingGoal._id,
          name: name.trim(),
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          targetDate: targetDate ? new Date(targetDate).getTime() : undefined,
          linkedAccountId: linkedAccountId ? linkedAccountId as Id<"accounts"> : undefined,
          color,
        });
      } else {
        await createGoal({
          name: name.trim(),
          targetAmount: parsedTarget,
          currentAmount: parsedCurrent,
          targetDate: targetDate ? new Date(targetDate).getTime() : undefined,
          linkedAccountId: linkedAccountId ? linkedAccountId as Id<"accounts"> : undefined,
          color,
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
            {editingGoal ? "Edit Goal" : "Create Goal"}
          </DialogTitle>
          <DialogDescription>
            {editingGoal 
              ? "Update your savings goal" 
              : "Set a target amount and track your progress"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Goal Name
            </label>
            <Input
              type="text"
              placeholder="e.g., Emergency Fund, New Car, Vacation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Target Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  type="number"
                  placeholder="10,000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="pl-8"
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Already Saved
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {currencySymbol}
                </span>
                <Input
                  type="number"
                  placeholder="0"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="pl-8"
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Target Date (optional)
            </label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              disabled={isLoading}
              min={format(new Date(), "yyyy-MM-dd")}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll calculate how much you need to save monthly
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Link to Account (optional)
            </label>
            <Select 
              value={linkedAccountId || "none"} 
              onValueChange={(val) => setLinkedAccountId(val === "none" ? "" : (val ?? ""))} 
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked account</SelectItem>
                {accounts?.map((acc) => (
                  <SelectItem key={acc._id} value={acc._id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  disabled={isLoading}
                  className={`size-7 rounded-full transition-all ${
                    color === c.value 
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" 
                      : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
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
              ) : editingGoal ? (
                "Save Changes"
              ) : (
                "Create Goal"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ContributionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: Id<"goals"> | null;
  goalName: string;
  currency: string;
}

export function ContributionForm({ 
  open, 
  onOpenChange, 
  goalId,
  goalName,
  currency 
}: ContributionFormProps) {
  const addContribution = useMutation(api.goals.addContribution);
  
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setAmount("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!goalId) return;
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    setIsLoading(true);
    try {
      await addContribution({
        id: goalId,
        amount: parsedAmount,
      });
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Contribution</DialogTitle>
          <DialogDescription>
            Add savings to &quot;{goalName}&quot;
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8"
                disabled={isLoading}
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
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
              {isLoading ? <Spinner className="size-4" /> : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
