"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  House,
  Lightning,
  DeviceMobile,
  WifiHigh,
  Car,
  Shield,
  FilmStrip,
  Barbell,
  Coffee,
  Briefcase,
  Money,
  Receipt,
  Check,
  Trash,
} from "@phosphor-icons/react";

type UseCase = "personal" | "freelancer" | "small_business" | "agency";
type Frequency = "weekly" | "biweekly" | "monthly" | "yearly";

interface RecurringEntry {
  id: string;
  name: string;
  amount: string;
  type: "income" | "expense";
  frequency: Frequency;
  enabled: boolean;
  icon: string;
  color: string;
}

const COMMON_EXPENSES: RecurringEntry[] = [
  { id: "rent", name: "Rent / Mortgage", amount: "", type: "expense", frequency: "monthly", enabled: true, icon: "House", color: "#6366f1" },
  { id: "utilities", name: "Utilities", amount: "", type: "expense", frequency: "monthly", enabled: true, icon: "Lightning", color: "#f59e0b" },
  { id: "phone", name: "Phone", amount: "", type: "expense", frequency: "monthly", enabled: false, icon: "DeviceMobile", color: "#3b82f6" },
  { id: "internet", name: "Internet", amount: "", type: "expense", frequency: "monthly", enabled: false, icon: "WifiHigh", color: "#10b981" },
  { id: "car", name: "Car Payment", amount: "", type: "expense", frequency: "monthly", enabled: false, icon: "Car", color: "#8b5cf6" },
  { id: "insurance", name: "Insurance", amount: "", type: "expense", frequency: "monthly", enabled: false, icon: "Shield", color: "#ec4899" },
  { id: "streaming", name: "Streaming Services", amount: "", type: "expense", frequency: "monthly", enabled: false, icon: "FilmStrip", color: "#ef4444" },
  { id: "gym", name: "Gym Membership", amount: "", type: "expense", frequency: "monthly", enabled: false, icon: "Barbell", color: "#14b8a6" },
];

const INCOME_SUGGESTIONS: Record<UseCase, RecurringEntry[]> = {
  personal: [
    { id: "salary", name: "Salary", amount: "", type: "income", frequency: "monthly", enabled: true, icon: "Money", color: "#22c55e" },
  ],
  freelancer: [
    { id: "retainer", name: "Monthly Retainer", amount: "", type: "income", frequency: "monthly", enabled: true, icon: "Briefcase", color: "#22c55e" },
    { id: "salary", name: "Side Income", amount: "", type: "income", frequency: "monthly", enabled: false, icon: "Money", color: "#10b981" },
  ],
  small_business: [
    { id: "revenue", name: "Monthly Revenue", amount: "", type: "income", frequency: "monthly", enabled: true, icon: "Money", color: "#22c55e" },
  ],
  agency: [
    { id: "retainers", name: "Client Retainers", amount: "", type: "income", frequency: "monthly", enabled: true, icon: "Briefcase", color: "#22c55e" },
    { id: "projects", name: "Project Income", amount: "", type: "income", frequency: "monthly", enabled: false, icon: "Money", color: "#10b981" },
  ],
};

const BUSINESS_EXPENSES: RecurringEntry[] = [
  { id: "software", name: "Software Subscriptions", amount: "", type: "expense", frequency: "monthly", enabled: true, icon: "Receipt", color: "#6366f1" },
  { id: "office", name: "Office Rent", amount: "", type: "expense", frequency: "monthly", enabled: false, icon: "House", color: "#8b5cf6" },
  { id: "payroll", name: "Payroll", amount: "", type: "expense", frequency: "biweekly", enabled: false, icon: "Money", color: "#ec4899" },
  { id: "marketing", name: "Marketing", amount: "", type: "expense", frequency: "monthly", enabled: false, icon: "Receipt", color: "#f59e0b" },
];

interface RecurringStepProps {
  useCase: UseCase;
  currencySymbol: string;
  onNext: (recurring: RecurringEntry[]) => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

export function RecurringStep({
  useCase,
  currencySymbol,
  onNext,
  onBack,
  onSkip,
  isLoading,
}: RecurringStepProps) {
  const getInitialRecurring = (): RecurringEntry[] => {
    const income = INCOME_SUGGESTIONS[useCase] || INCOME_SUGGESTIONS.personal;
    const expenses = useCase === "personal" 
      ? COMMON_EXPENSES 
      : [...BUSINESS_EXPENSES, ...COMMON_EXPENSES.slice(0, 4)];
    return [...income, ...expenses];
  };

  const [recurring, setRecurring] = useState<RecurringEntry[]>(getInitialRecurring());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"income" | "expense">("expense");
  const [newFrequency, setNewFrequency] = useState<Frequency>("monthly");

  const toggleEnabled = (id: string) => {
    setRecurring((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const updateAmount = (id: string, amount: string) => {
    setRecurring((prev) =>
      prev.map((r) => (r.id === id ? { ...r, amount } : r))
    );
  };

  const removeItem = (id: string) => {
    setRecurring((prev) => prev.filter((r) => r.id !== id));
  };

  const addItem = () => {
    if (!newName.trim()) return;
    
    const newEntry: RecurringEntry = {
      id: Date.now().toString(),
      name: newName.trim(),
      amount: "",
      type: newType,
      frequency: newFrequency,
      enabled: true,
      icon: newType === "income" ? "Money" : "Receipt",
      color: newType === "income" ? "#22c55e" : "#6366f1",
    };
    
    setRecurring((prev) => [...prev, newEntry]);
    setNewName("");
    setShowAddForm(false);
  };

  const handleNext = () => {
    // Filter to only enabled items with amounts
    const validRecurring = recurring.filter(
      (r) => r.enabled && r.amount.trim() !== ""
    );
    onNext(validRecurring);
  };

  const hasValidItems = recurring.some(
    (r) => r.enabled && r.amount.trim() !== ""
  );

  const incomeItems = recurring.filter((r) => r.type === "income");
  const expenseItems = recurring.filter((r) => r.type === "expense");

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, typeof House> = {
      House,
      Lightning,
      DeviceMobile,
      WifiHigh,
      Car,
      Shield,
      FilmStrip,
      Barbell,
      Coffee,
      Briefcase,
      Money,
      Receipt,
    };
    return icons[iconName] || Receipt;
  };

  const frequencyLabels: Record<Frequency, string> = {
    weekly: "Weekly",
    biweekly: "Bi-weekly",
    monthly: "Monthly",
    yearly: "Yearly",
  };

  return (
    <Card className="border-0 ring-0 shadow-none bg-transparent">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Set Up Recurring Transactions</CardTitle>
        <CardDescription>
          Add your regular income and bills for automatic tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-[360px] overflow-y-auto pr-1 space-y-4">
          {/* Income Section */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500" />
              Income
            </h3>
            <div className="space-y-2">
              {incomeItems.map((item) => {
                const Icon = getIconComponent(item.icon);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2 border rounded-sm transition-colors ${
                      item.enabled ? "bg-card" : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <Checkbox
                      checked={item.enabled}
                      onCheckedChange={() => toggleEnabled(item.id)}
                      disabled={isLoading}
                    />
                    <Icon
                      className="size-4 shrink-0"
                      style={{ color: item.color }}
                      weight="duotone"
                    />
                    <span className="text-sm flex-1 truncate">{item.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {frequencyLabels[item.frequency]}
                    </Badge>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.amount}
                        onChange={(e) => updateAmount(item.id, e.target.value)}
                        className="pl-6 h-7 text-xs"
                        disabled={isLoading || !item.enabled}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      className="size-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash className="size-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Expenses Section */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <div className="size-2 rounded-full bg-red-500" />
              Expenses
            </h3>
            <div className="space-y-2">
              {expenseItems.map((item) => {
                const Icon = getIconComponent(item.icon);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2 border rounded-sm transition-colors ${
                      item.enabled ? "bg-card" : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <Checkbox
                      checked={item.enabled}
                      onCheckedChange={() => toggleEnabled(item.id)}
                      disabled={isLoading}
                    />
                    <Icon
                      className="size-4 shrink-0"
                      style={{ color: item.color }}
                      weight="duotone"
                    />
                    <span className="text-sm flex-1 truncate">{item.name}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {frequencyLabels[item.frequency]}
                    </Badge>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                        {currencySymbol}
                      </span>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.amount}
                        onChange={(e) => updateAmount(item.id, e.target.value)}
                        className="pl-6 h-7 text-xs"
                        disabled={isLoading || !item.enabled}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      disabled={isLoading}
                      className="size-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash className="size-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm ? (
          <div className="flex items-center gap-2 p-3 border rounded-sm border-dashed">
            <Input
              type="text"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 h-8"
              autoFocus
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as "income" | "expense")}
              className="h-8 px-2 text-xs border rounded-sm bg-background"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              value={newFrequency}
              onChange={(e) => setNewFrequency(e.target.value as Frequency)}
              className="h-8 px-2 text-xs border rounded-sm bg-background"
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Button size="sm" onClick={addItem} className="h-8">
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="h-8"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="w-full border-dashed"
            disabled={isLoading}
          >
            <Plus className="size-4 mr-2" />
            Add Custom
          </Button>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-10"
            disabled={isLoading}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={onSkip}
            className="h-10"
            disabled={isLoading}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 h-10 gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <>
                <span>{hasValidItems ? "Continue" : "Skip"}</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
