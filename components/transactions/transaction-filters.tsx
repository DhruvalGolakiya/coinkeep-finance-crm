"use client";

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
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

type TransactionType = "income" | "expense" | "transfer";

interface TransactionFiltersProps {
  typeFilter: TransactionType | "all";
  setTypeFilter: (type: TransactionType | "all") => void;
  accountFilter: string;
  setAccountFilter: (account: string) => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  accounts: Array<{ _id: string; name: string }>;
  categories: Array<{ _id: string; name: string; type: string }>;
}

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];

export function TransactionFilters({
  typeFilter,
  setTypeFilter,
  accountFilter,
  setAccountFilter,
  categoryFilter,
  setCategoryFilter,
  searchQuery,
  setSearchQuery,
  accounts,
  categories,
}: TransactionFiltersProps) {
  const hasFilters =
    typeFilter !== "all" ||
    accountFilter !== "all" ||
    categoryFilter !== "all" ||
    searchQuery !== "";

  const clearFilters = () => {
    setTypeFilter("all");
    setAccountFilter("all");
    setCategoryFilter("all");
    setSearchQuery("");
  };

  const accountOptions = [
    { value: "all", label: "All Accounts" },
    ...accounts.map((a) => ({ value: a._id, label: a.name })),
  ];

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Type Filter */}
      <Select
        value={typeFilter}
        onValueChange={(v) => setTypeFilter(v as TransactionType | "all")}
        items={typeOptions}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Account Filter */}
      <Select
        value={accountFilter}
        onValueChange={(v) => v && setAccountFilter(v)}
        items={accountOptions}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {accountOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Category Filter */}
      <Select
        value={categoryFilter}
        onValueChange={(v) => v && setCategoryFilter(v)}
        items={categoryOptions}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {categoryOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <XIcon className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}

