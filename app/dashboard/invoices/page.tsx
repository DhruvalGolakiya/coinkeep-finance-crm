"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/layout/header";
import { InvoiceList } from "@/components/invoices/invoice-list";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoicePreview } from "@/components/invoices/invoice-preview";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Id } from "@/convex/_generated/dataModel";
import { 
  FileTextIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon, 
  ClockIcon,
  TrendUpIcon,
  ArrowsLeftRight,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { getExchangeRate, formatExchangeRate, getCurrencySymbol, convertCurrency } from "@/lib/exchange-rate";
import { useAuth } from "@/components/providers/auth-provider";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

interface PaymentModalState {
  invoiceId: Id<"invoices">;
  total: number;
  currency: string;
}

export default function InvoicesPage() {
  const { user } = useAuth();
  const invoices = useQuery(api.invoices.list);
  const clients = useQuery(api.clients.list);
  const accounts = useQuery(api.accounts.list);
  const stats = useQuery(api.invoices.getStats);
  const createInvoice = useMutation(api.invoices.create);
  const updateInvoice = useMutation(api.invoices.update);
  const updateStatus = useMutation(api.invoices.updateStatus);
  const markAsPaid = useMutation(api.invoices.markAsPaid);
  const deleteInvoice = useMutation(api.invoices.remove);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<{
    _id: Id<"invoices">;
    clientId: Id<"clients">;
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    currency?: string;
    issueDate: number;
    dueDate: number;
    taxRate: number;
    notes?: string;
  } | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<{
    invoiceNumber: string;
    status: "draft" | "sent" | "paid" | "overdue";
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    currency?: string;
    issueDate: number;
    dueDate: number;
    subtotal: number;
    tax: number;
    taxRate: number;
    total: number;
    notes?: string;
    client?: { name: string; email?: string; address?: string } | null;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"invoices"> | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  
  // Exchange rate state for payment modal
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [manualRate, setManualRate] = useState<string>("");
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [useManualRate, setUseManualRate] = useState(false);

  const filteredInvoices = invoices?.filter(
    (inv) => statusFilter === "all" || inv.status === statusFilter
  );

  // Get the selected account's currency
  const selectedAccount = accounts?.find(a => a._id === selectedAccountId);
  const accountCurrency = selectedAccount?.currency || user?.currency || "USD";
  
  // Determine if currency conversion is needed
  const needsConversion = paymentModal && paymentModal.currency !== accountCurrency;
  
  // Calculate the converted amount
  const effectiveRate = useManualRate && manualRate ? parseFloat(manualRate) : exchangeRate;
  const convertedAmount = needsConversion && effectiveRate && paymentModal
    ? convertCurrency(paymentModal.total, effectiveRate)
    : paymentModal?.total ?? 0;

  // Fetch exchange rate when payment modal opens or account changes
  useEffect(() => {
    if (paymentModal && selectedAccountId && needsConversion) {
      setIsLoadingRate(true);
      getExchangeRate(paymentModal.currency, accountCurrency)
        .then((rate) => {
          setExchangeRate(rate);
          setManualRate(rate?.toString() || "");
        })
        .finally(() => setIsLoadingRate(false));
    } else {
      setExchangeRate(null);
      setManualRate("");
    }
  }, [paymentModal?.invoiceId, selectedAccountId, needsConversion, paymentModal?.currency, accountCurrency]);

  const handleCreate = () => {
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: {
    clientId: Id<"clients">;
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    currency: string;
    issueDate: number;
    dueDate: number;
    taxRate: number;
    notes?: string;
  }) => {
    if (editingInvoice) {
      await updateInvoice({
        id: editingInvoice._id,
        items: data.items,
        currency: data.currency,
        dueDate: data.dueDate,
        taxRate: data.taxRate,
        notes: data.notes,
      });
      setEditingInvoice(null);
    } else {
      await createInvoice(data);
    }
    setIsFormOpen(false);
  };

  const handleEdit = (invoice: {
    _id: Id<"invoices">;
    clientId: Id<"clients">;
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    currency?: string;
    issueDate: number;
    dueDate: number;
    taxRate: number;
    notes?: string;
  }) => {
    setEditingInvoice(invoice);
    setIsFormOpen(true);
  };

  const handleStatusChange = async (id: Id<"invoices">, status: InvoiceStatus) => {
    await updateStatus({ id, status });
  };

  const handleMarkAsPaid = async () => {
    if (paymentModal && selectedAccountId) {
      await markAsPaid({
        id: paymentModal.invoiceId,
        accountId: selectedAccountId as Id<"accounts">,
        convertedAmount: needsConversion ? convertedAmount : undefined,
        exchangeRate: needsConversion ? effectiveRate ?? undefined : undefined,
      });
      setPaymentModal(null);
      setSelectedAccountId("");
      setExchangeRate(null);
      setManualRate("");
      setUseManualRate(false);
    }
  };
  
  const resetPaymentModal = () => {
    setPaymentModal(null);
    setSelectedAccountId("");
    setExchangeRate(null);
    setManualRate("");
    setUseManualRate(false);
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteInvoice({ id: deletingId });
      setDeletingId(null);
    }
  };

  const isLoading = !invoices || !clients;

  const accountItems = (accounts ?? []).map((a) => ({
    value: a._id,
    label: a.name,
  }));

  function formatCompact(amount: number): string {
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Invoices"
        subtitle={`${invoices?.length ?? 0} invoice${invoices?.length !== 1 ? "s" : ""}`}
        action={{ label: "Create Invoice", onClick: handleCreate }}
      />

      <div className="flex-1 overflow-y-auto space-y-6 p-6">
        {/* Hero Stats Section */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Total Billed - Hero */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Total Billed</span>
                <Badge variant="secondary">
                  <TrendUpIcon className="size-3" />
                  Overview
                </Badge>
              </CardTitle>
              <CardDescription>All invoices created</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!stats ? (
                <Skeleton className="h-12 w-48" />
              ) : (
                <p className="text-4xl font-semibold tracking-tight">
                  {formatCurrency(stats.totalAmount)}
                </p>
              )}
              
              {stats && stats.total > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Collection Rate</span>
                    <span className="font-medium">
                      {Math.round((stats.paidAmount / stats.totalAmount) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div 
                      className="h-full bg-emerald-500 transition-all" 
                      style={{ width: `${Math.round((stats.paidAmount / stats.totalAmount) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Invoices Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="size-4 text-foreground" />
                Invoices
              </CardTitle>
              <CardDescription>Total created</CardDescription>
            </CardHeader>
            <CardContent>
              {!stats ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.total}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Paid Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon className="size-4 text-primary" />
                Paid
              </CardTitle>
              <CardDescription>Collected</CardDescription>
            </CardHeader>
            <CardContent>
              {!stats ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-primary">
                  {formatCompact(stats.paidAmount)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="size-4 text-secondary" />
                Pending
              </CardTitle>
              <CardDescription>Outstanding</CardDescription>
            </CardHeader>
            <CardContent>
              {!stats ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight text-secondary">
                  {formatCompact(stats.pendingAmount)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CurrencyDollarIcon className="size-4 text-foreground" />
                Awaiting
              </CardTitle>
              <CardDescription>Pending payment</CardDescription>
            </CardHeader>
            <CardContent>
              {!stats ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-semibold tracking-tight">
                  {stats.sent + stats.draft}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-4">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as InvoiceStatus | "all")}
            items={[
              { value: "all", label: "All Invoices" },
              { value: "draft", label: "Draft" },
              { value: "sent", label: "Sent" },
              { value: "paid", label: "Paid" },
              { value: "overdue", label: "Overdue" },
            ]}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {stats && (
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-1">
                {stats.draft} Draft
              </span>
              <span className="rounded-full bg-primary-soft px-2 py-1 text-primary">
                {stats.sent} Sent
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                {stats.paid} Paid
              </span>
              <span className="rounded-full bg-destructive/10 px-2 py-1 text-destructive">
                {stats.overdue} Overdue
              </span>
            </div>
          )}
        </div>

        {/* Invoice List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredInvoices?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                <FileTextIcon className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mt-6 text-lg font-medium">No invoices found</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground max-w-sm">
                {invoices?.length === 0
                  ? "Create your first invoice to get started and manage your billing"
                  : "Try adjusting your filters to find invoices"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <InvoiceList
            invoices={filteredInvoices ?? []}
            onPreview={(inv) => setPreviewInvoice({
              invoiceNumber: inv.invoiceNumber,
              status: inv.status,
              items: inv.items,
              currency: inv.currency,
              issueDate: inv.issueDate,
              dueDate: inv.dueDate,
              subtotal: inv.subtotal,
              tax: inv.tax,
              taxRate: inv.taxRate,
              total: inv.total,
              notes: inv.notes,
              client: inv.client,
            })}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
            onMarkAsPaid={(id, total, currency) => setPaymentModal({ invoiceId: id, total, currency })}
            onDelete={(id) => setDeletingId(id)}
          />
        )}
      </div>

      {/* Invoice Form Dialog */}
      <InvoiceForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingInvoice(null);
        }}
        clients={clients ?? []}
        onSubmit={handleSubmit}
        editingInvoice={editingInvoice}
      />

      {/* Invoice Preview */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {/* Payment Modal */}
      <AlertDialog open={!!paymentModal} onOpenChange={resetPaymentModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Record Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Record payment of {getCurrencySymbol(paymentModal?.currency || "USD")}
              {paymentModal?.total.toLocaleString()} ({paymentModal?.currency})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Field>
              <FieldLabel>Deposit to Account</FieldLabel>
              <Select
                value={selectedAccountId}
                onValueChange={(v) => setSelectedAccountId(v ?? "")}
                items={accountItems}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {accounts?.map((a) => (
                      <SelectItem key={a._id} value={a._id}>
                        {a.name} ({a.currency})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>

            {/* Currency Conversion Section */}
            {needsConversion && selectedAccountId && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowsLeftRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Currency Conversion</span>
                </div>
                
                {isLoadingRate ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="h-4 w-4" />
                    Fetching exchange rate...
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Exchange Rate</span>
                      <span className="font-mono">
                        {exchangeRate 
                          ? formatExchangeRate(paymentModal!.currency, accountCurrency, exchangeRate)
                          : "Rate unavailable"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="use-manual-rate"
                        checked={useManualRate}
                        onChange={(e) => setUseManualRate(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <label htmlFor="use-manual-rate" className="text-sm">
                        Override with manual rate
                      </label>
                    </div>

                    {useManualRate && (
                      <Field>
                        <FieldLabel className="text-xs">Manual Exchange Rate</FieldLabel>
                        <Input
                          type="number"
                          step="0.0001"
                          value={manualRate}
                          onChange={(e) => setManualRate(e.target.value)}
                          placeholder="Enter exchange rate"
                        />
                      </Field>
                    )}

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Amount to record</span>
                        <span className="text-lg font-bold text-primary">
                          {getCurrencySymbol(accountCurrency)}
                          {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getCurrencySymbol(paymentModal!.currency)}{paymentModal!.total.toLocaleString()} × {effectiveRate?.toFixed(4) || "?"} = {getCurrencySymbol(accountCurrency)}{convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button 
              onClick={handleMarkAsPaid} 
              disabled={!selectedAccountId || (needsConversion && !effectiveRate) || isLoadingRate}
            >
              Confirm Payment
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

