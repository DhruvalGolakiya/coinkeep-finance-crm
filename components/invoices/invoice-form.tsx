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
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { Id } from "@/convex/_generated/dataModel";

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Array<{ _id: Id<"clients">; name: string; currency?: string }>;
  onSubmit: (data: {
    clientId: Id<"clients">;
    items: LineItem[];
    currency: string;
    issueDate: number;
    dueDate: number;
    taxRate: number;
    notes?: string;
  }) => void;
  editingInvoice?: {
    _id: Id<"invoices">;
    clientId: Id<"clients">;
    items: LineItem[];
    currency?: string;
    issueDate: number;
    dueDate: number;
    taxRate: number;
    notes?: string;
  } | null;
}

const CURRENCIES = [
  { value: "USD", label: "USD", symbol: "$" },
  { value: "EUR", label: "EUR", symbol: "€" },
  { value: "GBP", label: "GBP", symbol: "£" },
  { value: "INR", label: "INR", symbol: "₹" },
  { value: "CAD", label: "CAD", symbol: "C$" },
  { value: "AUD", label: "AUD", symbol: "A$" },
  { value: "JPY", label: "JPY", symbol: "¥" },
  { value: "SGD", label: "SGD", symbol: "S$" },
  { value: "AED", label: "AED", symbol: "د.إ" },
  { value: "CHF", label: "CHF", symbol: "CHF" },
];

export function InvoiceForm({
  open,
  onOpenChange,
  clients,
  onSubmit,
  editingInvoice,
}: InvoiceFormProps) {
  const [clientId, setClientId] = useState<string>("");
  const [currency, setCurrency] = useState("USD");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);

  // Get currency symbol for display
  const currencySymbol = CURRENCIES.find(c => c.value === currency)?.symbol || "$";

  const isEditing = !!editingInvoice;

  useEffect(() => {
    if (open) {
      if (editingInvoice) {
        // Editing mode - populate from existing invoice
        setClientId(editingInvoice.clientId);
        setCurrency(editingInvoice.currency ?? "USD");
        setIssueDate(new Date(editingInvoice.issueDate).toISOString().split("T")[0]);
        setDueDate(new Date(editingInvoice.dueDate).toISOString().split("T")[0]);
        setTaxRate(editingInvoice.taxRate.toString());
        setNotes(editingInvoice.notes ?? "");
        setItems(editingInvoice.items);
      } else {
        // Create mode - reset to defaults
        const firstClient = clients[0];
        setClientId(firstClient?._id ?? "");
        setCurrency(firstClient?.currency ?? "USD");
        setIssueDate(new Date().toISOString().split("T")[0]);
        setDueDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
        );
        setTaxRate("0");
        setNotes("");
        setItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
      }
    }
  }, [open, clients, editingInvoice]);

  // Update currency when client changes
  useEffect(() => {
    const selectedClient = clients.find(c => c._id === clientId);
    if (selectedClient?.currency) {
      setCurrency(selectedClient.currency);
    }
  }, [clientId, clients]);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "rate") {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * (parseFloat(taxRate) / 100);
  const total = subtotal + tax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    onSubmit({
      clientId: clientId as Id<"clients">,
      items,
      currency,
      issueDate: new Date(issueDate).getTime(),
      dueDate: new Date(dueDate).getTime(),
      taxRate: parseFloat(taxRate) || 0,
      notes: notes || undefined,
    });
  };

  const clientItems = clients.map((c) => ({ value: c._id, label: c.name }));

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl! max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>{isEditing ? "Edit Invoice" : "Create Invoice"}</AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="inv-client">Client</FieldLabel>
                <Select
                  value={clientId}
                  onValueChange={(v) => setClientId(v ?? "")}
                  items={clientItems}
                >
                  <SelectTrigger id="inv-client">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {clients.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="inv-issue-date">Issue Date</FieldLabel>
                <Input
                  id="inv-issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="inv-due-date">Due Date</FieldLabel>
                <Input
                  id="inv-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="inv-currency">Currency</FieldLabel>
                <Select value={currency} onValueChange={(v) => setCurrency(v ?? "USD")}>
                  <SelectTrigger id="inv-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.symbol} {c.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FieldLabel className="text-base font-medium">Line Items</FieldLabel>
                <Button type="button" variant="ghost" size="sm" onClick={addItem}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-5">
                      {index === 0 && (
                        <span className="text-xs text-muted-foreground">Description</span>
                      )}
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          updateItem(index, "description", e.target.value)
                        }
                        placeholder="Item description"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      {index === 0 && (
                        <span className="text-xs text-muted-foreground">Qty</span>
                      )}
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      {index === 0 && (
                        <span className="text-xs text-muted-foreground">Rate</span>
                      )}
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.rate}
                        onChange={(e) =>
                          updateItem(index, "rate", parseFloat(e.target.value) || 0)
                        }
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      {index === 0 && (
                        <span className="text-xs text-muted-foreground">Amount</span>
                      )}
                      <Input
                        value={`${currencySymbol}${item.amount.toFixed(2)}`}
                        disabled
                        className="bg-muted/50"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2 rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tax ({taxRate}%)</span>
                  <span className="text-sm font-medium">{currencySymbol}{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-base font-bold">Total ({currency})</span>
                  <span className="text-xl font-bold text-primary">{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Field>
              <FieldLabel htmlFor="inv-notes">Notes</FieldLabel>
              <Textarea
                id="inv-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment terms, thank you message, etc."
                rows={2}
              />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button type="submit" disabled={!clientId || items.length === 0}>
              {isEditing ? "Save Changes" : "Create Invoice"}
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
