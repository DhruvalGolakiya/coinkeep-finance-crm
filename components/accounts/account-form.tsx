"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  BankIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  ChartLineUpIcon,
  HouseIcon,
  BuildingsIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type AccountType = "bank" | "credit_card" | "cash" | "investment" | "asset";

interface AccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: {
    _id: string;
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
    isBusinessAccount: boolean;
    color?: string;
  } | null;
  onSubmit: (data: {
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
    isBusinessAccount: boolean;
    color?: string;
  }) => void;
}

const accountTypes = [
  { value: "bank", label: "Bank Account", icon: BankIcon },
  { value: "credit_card", label: "Credit Card", icon: CreditCardIcon },
  { value: "cash", label: "Cash", icon: CurrencyDollarIcon },
  { value: "investment", label: "Investment", icon: ChartLineUpIcon },
  { value: "asset", label: "Asset", icon: HouseIcon },
];

const currencies = [
  { value: "USD", label: "USD", description: "US Dollar" },
  { value: "EUR", label: "EUR", description: "Euro" },
  { value: "GBP", label: "GBP", description: "British Pound" },
  { value: "INR", label: "INR", description: "Indian Rupee" },
  { value: "CAD", label: "CAD", description: "Canadian Dollar" },
  { value: "AUD", label: "AUD", description: "Australian Dollar" },
];

export function AccountForm({
  open,
  onOpenChange,
  account,
  onSubmit,
}: AccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [balance, setBalance] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [isBusinessAccount, setIsBusinessAccount] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setBalance(account.balance.toString());
      setCurrency(account.currency);
      setIsBusinessAccount(account.isBusinessAccount);
    } else {
      setName("");
      setType("bank");
      setBalance("0");
      setCurrency("USD");
      setIsBusinessAccount(false);
    }
  }, [account, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      balance: parseFloat(balance) || 0,
      currency,
      isBusinessAccount,
    });
  };

  const isLiability = type === "credit_card";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">
            {account ? "Edit Account" : "Add New Account"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {account 
              ? "Update your account details below."
              : "Create a new account to track your finances."
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-6 space-y-5">
            {/* Account Name */}
            <Field>
              <FieldLabel htmlFor="account-name">Account Name</FieldLabel>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Main Checking Account"
                required
                className="h-11"
              />
            </Field>

            {/* Account Type Selection */}
            <Field>
              <FieldLabel>Account Type</FieldLabel>
              <div className="grid grid-cols-3 gap-2">
                {accountTypes.map((accountType) => {
                  const Icon = accountType.icon;
                  const isSelected = type === accountType.value;
                  return (
                    <button
                      key={accountType.value}
                      type="button"
                      onClick={() => setType(accountType.value as AccountType)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all",
                        isSelected
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
                      )}
                    >
                      {isSelected && (
                        <div className="absolute right-1.5 top-1.5">
                          <CheckIcon className="size-3.5 text-foreground" weight="bold" />
                        </div>
                      )}
                      <Icon 
                        className={cn(
                          "size-5",
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        )} 
                        weight={isSelected ? "bold" : "regular"}
                      />
                      <span className={cn(
                        "text-xs",
                        isSelected ? "font-medium text-foreground" : "text-muted-foreground"
                      )}>
                        {accountType.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Balance and Currency */}
            <div className="grid grid-cols-3 gap-4">
              <Field className="col-span-2">
                <FieldLabel htmlFor="account-balance">
                  {isLiability ? "Balance Owed" : "Current Balance"}
                </FieldLabel>
                <Input
                  id="account-balance"
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  placeholder="0.00"
                  className="h-11 text-lg font-medium tabular-nums"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="account-currency">Currency</FieldLabel>
                <Select
                  value={currency}
                  onValueChange={(v) => v && setCurrency(v)}
                  items={currencies}
                >
                  <SelectTrigger id="account-currency" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {currencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <span className="font-medium">{c.value}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Business Account Toggle */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                  <BuildingsIcon className="size-4 text-muted-foreground" weight="bold" />
                </div>
                <div>
                  <p className="text-sm font-medium">Business Account</p>
                  <p className="text-xs text-muted-foreground">
                    Mark this account for business transactions
                  </p>
                </div>
              </div>
              <Switch
                checked={isBusinessAccount}
                onCheckedChange={setIsBusinessAccount}
              />
            </div>
          </FieldGroup>

          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button type="submit">
              {account ? "Save Changes" : "Create Account"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
