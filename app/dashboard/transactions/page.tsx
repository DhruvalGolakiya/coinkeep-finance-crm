"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/layout/header";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Id } from "@/convex/_generated/dataModel";
import {
  ArrowsLeftRightIcon,
  TrendUpIcon,
  TrendDownIcon,
  CurrencyDollarIcon,
} from "@phosphor-icons/react";
import { useFormatCurrency } from "@/lib/format";

type TransactionType = "income" | "expense" | "transfer";

export default function TransactionsPage() {
  const transactions = useQuery(api.transactions.list, {});
  const accounts = useQuery(api.accounts.list);
  const categories = useQuery(api.categories.list);
  const createTransaction = useMutation(api.transactions.create);
  const updateTransaction = useMutation(api.transactions.update);
  const deleteTransaction = useMutation(api.transactions.remove);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<TransactionType>("expense");
  const [deletingId, setDeletingId] = useState<Id<"transactions"> | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<{
    _id: Id<"transactions">;
    description: string;
    categoryId?: Id<"categories">;
    isBusinessExpense: boolean;
    notes?: string;
  } | null>(null);

  // Edit form state
  const [editDescription, setEditDescription] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [editIsBusinessExpense, setEditIsBusinessExpense] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  // Filters
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];

    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (accountFilter !== "all" && t.accountId !== accountFilter)
        return false;
      if (categoryFilter !== "all" && t.categoryId !== categoryFilter)
        return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !t.description.toLowerCase().includes(query) &&
          !t.account?.name?.toLowerCase().includes(query) &&
          !t.category?.name?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, typeFilter, accountFilter, categoryFilter, searchQuery]);

  const handleCreate = (type: TransactionType = "expense") => {
    setFormType(type);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteTransaction({ id: deletingId });
      setDeletingId(null);
    }
  };

  const handleSubmit = async (data: {
    accountId: Id<"accounts">;
    type: TransactionType;
    amount: number;
    categoryId?: Id<"categories">;
    description: string;
    date: number;
    isBusinessExpense: boolean;
    toAccountId?: Id<"accounts">;
    notes?: string;
  }) => {
    await createTransaction(data);
    setIsFormOpen(false);
  };

  const handleOpenEdit = (transaction: {
    _id: Id<"transactions">;
    description: string;
    categoryId?: Id<"categories">;
    isBusinessExpense: boolean;
    notes?: string;
  }) => {
    setEditingTransaction(transaction);
    setEditDescription(transaction.description);
    setEditCategoryId(transaction.categoryId ?? "");
    setEditIsBusinessExpense(transaction.isBusinessExpense);
    setEditNotes(transaction.notes ?? "");
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;

    await updateTransaction({
      id: editingTransaction._id,
      description: editDescription,
      categoryId: editCategoryId
        ? (editCategoryId as Id<"categories">)
        : undefined,
      isBusinessExpense: editIsBusinessExpense,
      notes: editNotes || undefined,
    });
    setEditingTransaction(null);
  };

  const isLoading = !transactions || !accounts || !categories;
  const formatCurrency = useFormatCurrency();

  // Calculate totals
  const totals = useMemo(() => {
    if (!filteredTransactions.length) return { income: 0, expenses: 0, net: 0 };

    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, net: income - expenses };
  }, [filteredTransactions]);

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Transactions"
        subtitle={`${filteredTransactions.length} transaction${
          filteredTransactions.length !== 1 ? "s" : ""
        }`}
        action={{ label: "Add Transaction", onClick: () => handleCreate() }}
      />

      <div className="flex-1 overflow-y-auto space-y-4 p-6">
        {/* Filters */}
        <TransactionFilters
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          accountFilter={accountFilter}
          setAccountFilter={setAccountFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          accounts={accounts ?? []}
          categories={categories ?? []}
        />

        {/* Hero Stats Section */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Net Flow - Hero */}

          {/* Income Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUpIcon className="size-4 text-primary" />
                Income
              </CardTitle>
              <CardDescription>Total received</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight text-primary">
                {formatCurrency(totals.income, { compact: true })}
              </p>
            </CardContent>
          </Card>

          {/* Expenses Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendDownIcon className="size-4 text-destructive" />
                Expenses
              </CardTitle>
              <CardDescription>Total spent</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight text-destructive">
                {formatCurrency(totals.expenses, { compact: true })}
              </p>
            </CardContent>
          </Card>

          {/* Transactions Count Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollarIcon className="size-4 text-foreground" />
                Activity
              </CardTitle>
              <CardDescription>Transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tracking-tight">
                {filteredTransactions.length}
              </p>
            </CardContent>
          </Card>

          {/* Savings Rate Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendUpIcon className="size-4 text-foreground" />
                Rate
              </CardTitle>
              <CardDescription>Savings rate</CardDescription>
            </CardHeader>
            <CardContent>
              {totals.income > 0 ? (
                <p className="text-2xl font-semibold tracking-tight">
                  {Math.round((totals.net / totals.income) * 100)}%
                </p>
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-muted-foreground">
                  -
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                <ArrowsLeftRightIcon className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-medium">
                No transactions found
              </h3>
              <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                {transactions?.length === 0
                  ? "Create your first transaction to start tracking your finances"
                  : "Try adjusting your filters to find transactions"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <TransactionTable
            transactions={filteredTransactions}
            onEdit={handleOpenEdit}
            onDelete={(id) => setDeletingId(id)}
          />
        )}
      </div>

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        type={formType}
        onTypeChange={setFormType}
        accounts={accounts ?? []}
        categories={categories ?? []}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This will also
              reverse the balance change on the associated account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Transaction Dialog */}
      <AlertDialog
        open={!!editingTransaction}
        onOpenChange={() => setEditingTransaction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Update the transaction details below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="edit-description">Description</FieldLabel>
              <Input
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Transaction description"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-category">Category</FieldLabel>
              <Select
                value={editCategoryId}
                onValueChange={(v) => setEditCategoryId(v ?? "")}
              >
                <SelectTrigger id="edit-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="">None</SelectItem>
                    {categories?.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="size-2 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-notes">Notes</FieldLabel>
              <Textarea
                id="edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </Field>

            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-business"
                checked={editIsBusinessExpense}
                onCheckedChange={(checked) =>
                  setEditIsBusinessExpense(!!checked)
                }
              />
              <label htmlFor="edit-business" className="text-sm">
                Business expense
              </label>
            </div>
          </FieldGroup>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
