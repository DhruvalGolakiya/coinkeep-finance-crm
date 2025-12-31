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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/components/providers/auth-provider";

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "CHF", label: "CHF - Swiss Franc" },
];

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    company?: string;
    currency?: string;
    notes?: string;
  } | null;
  onSubmit: (data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    company?: string;
    currency?: string;
    notes?: string;
  }) => void;
}

export function ClientForm({
  open,
  onOpenChange,
  client,
  onSubmit,
}: ClientFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [company, setCompany] = useState("");
  const [currency, setCurrency] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (client) {
      setName(client.name);
      setEmail(client.email ?? "");
      setPhone(client.phone ?? "");
      setAddress(client.address ?? "");
      setCompany(client.company ?? "");
      setCurrency(client.currency ?? user?.currency ?? "USD");
      setNotes(client.notes ?? "");
    } else {
      setName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setCompany("");
      setCurrency(user?.currency ?? "USD");
      setNotes("");
    }
  }, [client, open, user?.currency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      company: company || undefined,
      currency: currency || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {client ? "Edit Client" : "Add New Client"}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="py-4">
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="client-name">Name *</FieldLabel>
                <Input
                  id="client-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="client-company">Company</FieldLabel>
                <Input
                  id="client-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Inc."
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="client-email">Email</FieldLabel>
                <Input
                  id="client-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="client-phone">Phone</FieldLabel>
                <Input
                  id="client-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 890"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field className="col-span-2 sm:col-span-1">
                <FieldLabel htmlFor="client-address">Address</FieldLabel>
                <Textarea
                  id="client-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, City, Country"
                  rows={2}
                />
              </Field>

              <Field className="col-span-2 sm:col-span-1">
                <FieldLabel htmlFor="client-currency">Billing Currency</FieldLabel>
                <Select value={currency} onValueChange={(value) => setCurrency(value ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Invoices will default to this currency
                </p>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="client-notes">Notes</FieldLabel>
              <Textarea
                id="client-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this client..."
                rows={2}
              />
            </Field>
          </FieldGroup>

          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <Button type="submit">{client ? "Save Changes" : "Add Client"}</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

