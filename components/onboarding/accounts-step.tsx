"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash,
  Bank,
  CreditCard,
  Wallet,
  PiggyBank,
  ChartLineUp,
  House,
  Receipt,
  Check,
} from "@phosphor-icons/react";

type UseCase = "personal" | "freelancer" | "small_business" | "agency";
type AccountType = "bank" | "credit_card" | "cash" | "investment" | "asset";

interface AccountEntry {
  id: string;
  name: string;
  type: AccountType;
  balance: string;
  isBusinessAccount: boolean;
  color: string;
  icon: string;
}

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: typeof Bank }[] = [
  { value: "bank", label: "Bank", icon: Bank },
  { value: "credit_card", label: "Credit Card", icon: CreditCard },
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "investment", label: "Investment", icon: ChartLineUp },
  { value: "asset", label: "Asset", icon: House },
];

const ACCOUNT_SUGGESTIONS: Record<UseCase, AccountEntry[]> = {
  personal: [
    { id: "1", name: "Checking Account", type: "bank", balance: "", isBusinessAccount: false, color: "#6366f1", icon: "Bank" },
    { id: "2", name: "Savings Account", type: "bank", balance: "", isBusinessAccount: false, color: "#22c55e", icon: "PiggyBank" },
    { id: "3", name: "Credit Card", type: "credit_card", balance: "", isBusinessAccount: false, color: "#ef4444", icon: "CreditCard" },
    { id: "4", name: "Cash", type: "cash", balance: "", isBusinessAccount: false, color: "#f97316", icon: "Wallet" },
  ],
  freelancer: [
    { id: "1", name: "Personal Checking", type: "bank", balance: "", isBusinessAccount: false, color: "#6366f1", icon: "Bank" },
    { id: "2", name: "Business Account", type: "bank", balance: "", isBusinessAccount: true, color: "#8b5cf6", icon: "Briefcase" },
    { id: "3", name: "Savings", type: "bank", balance: "", isBusinessAccount: false, color: "#22c55e", icon: "PiggyBank" },
    { id: "4", name: "Business Credit Card", type: "credit_card", balance: "", isBusinessAccount: true, color: "#ef4444", icon: "CreditCard" },
  ],
  small_business: [
    { id: "1", name: "Business Checking", type: "bank", balance: "", isBusinessAccount: true, color: "#6366f1", icon: "Bank" },
    { id: "2", name: "Business Savings", type: "bank", balance: "", isBusinessAccount: true, color: "#22c55e", icon: "PiggyBank" },
    { id: "3", name: "Business Credit Card", type: "credit_card", balance: "", isBusinessAccount: true, color: "#ef4444", icon: "CreditCard" },
    { id: "4", name: "Petty Cash", type: "cash", balance: "", isBusinessAccount: true, color: "#f97316", icon: "Wallet" },
  ],
  agency: [
    { id: "1", name: "Operating Account", type: "bank", balance: "", isBusinessAccount: true, color: "#6366f1", icon: "Bank" },
    { id: "2", name: "Payroll Account", type: "bank", balance: "", isBusinessAccount: true, color: "#8b5cf6", icon: "Users" },
    { id: "3", name: "Business Credit Card", type: "credit_card", balance: "", isBusinessAccount: true, color: "#ef4444", icon: "CreditCard" },
    { id: "4", name: "Tax Reserve", type: "bank", balance: "", isBusinessAccount: true, color: "#22c55e", icon: "Receipt" },
  ],
};

interface AccountsStepProps {
  useCase: UseCase;
  currency: string;
  currencySymbol: string;
  onNext: (accounts: AccountEntry[]) => void;
  onBack: () => void;
  onSkip: () => void;
  isLoading: boolean;
}

export function AccountsStep({
  useCase,
  currency,
  currencySymbol,
  onNext,
  onBack,
  onSkip,
  isLoading,
}: AccountsStepProps) {
  const [accounts, setAccounts] = useState<AccountEntry[]>(
    ACCOUNT_SUGGESTIONS[useCase] || ACCOUNT_SUGGESTIONS.personal
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<AccountType>("bank");

  const updateBalance = (id: string, balance: string) => {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, balance } : a))
    );
  };

  const removeAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const addAccount = () => {
    if (!newAccountName.trim()) return;
    
    const newAccount: AccountEntry = {
      id: Date.now().toString(),
      name: newAccountName.trim(),
      type: newAccountType,
      balance: "",
      isBusinessAccount: useCase !== "personal",
      color: "#6366f1",
      icon: ACCOUNT_TYPES.find((t) => t.value === newAccountType)?.icon.displayName || "Bank",
    };
    
    setAccounts((prev) => [...prev, newAccount]);
    setNewAccountName("");
    setShowAddForm(false);
  };

  const handleNext = () => {
    // Filter out accounts with no balance entered
    const validAccounts = accounts.filter((a) => a.balance.trim() !== "");
    onNext(validAccounts);
  };

  const hasValidAccounts = accounts.some((a) => a.balance.trim() !== "");

  const getIconComponent = (type: AccountType) => {
    const config = ACCOUNT_TYPES.find((t) => t.value === type);
    return config?.icon || Bank;
  };

  return (
    <Card className="border-0 ring-0 shadow-none bg-transparent">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Add Your Accounts</CardTitle>
        <CardDescription>
          Enter your current balances to start tracking. You can add more later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account List */}
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {accounts.map((account) => {
            const Icon = getIconComponent(account.type);
            return (
              <div
                key={account.id}
                className="flex items-center gap-3 p-3 border rounded-sm bg-card"
              >
                <div
                  className="size-10 rounded-sm flex items-center justify-center shrink-0"
                  style={{ backgroundColor: account.color + "20" }}
                >
                  <Icon
                    className="size-5"
                    style={{ color: account.color }}
                    weight="duotone"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {account.name}
                    </span>
                    {account.isBusinessAccount && (
                      <Badge variant="outline" className="text-[10px]">
                        Business
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {account.type.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      {currencySymbol}
                    </span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={account.balance}
                      onChange={(e) => updateBalance(account.id, e.target.value)}
                      className="pl-7 h-8 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAccount(account.id)}
                    disabled={isLoading}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Account Form */}
        {showAddForm ? (
          <div className="flex items-center gap-2 p-3 border rounded-sm border-dashed">
            <Input
              type="text"
              placeholder="Account name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              className="flex-1 h-8"
              autoFocus
            />
            <select
              value={newAccountType}
              onChange={(e) => setNewAccountType(e.target.value as AccountType)}
              className="h-8 px-2 text-xs border rounded-sm bg-background"
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={addAccount} className="h-8">
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
            Add Another Account
          </Button>
        )}

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          💡 For credit cards and loans, enter the amount you owe as a positive number
        </p>

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
                <span>{hasValidAccounts ? "Continue" : "Skip"}</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
