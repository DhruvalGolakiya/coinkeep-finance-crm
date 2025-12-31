"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Header } from "@/components/layout/header";
import { ClientCard } from "@/components/clients/client-card";
import { ClientForm } from "@/components/clients/client-form";
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
import { Id } from "@/convex/_generated/dataModel";
import { UsersIcon } from "@phosphor-icons/react";

interface ClientData {
  _id: Id<"clients">;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  invoiceCount?: number;
  totalBilled?: number;
  totalPaid?: number;
  outstanding?: number;
}

export default function ClientsPage() {
  const clients = useQuery(api.clients.getWithInvoiceStats);
  const createClient = useMutation(api.clients.create);
  const updateClient = useMutation(api.clients.update);
  const deleteClient = useMutation(api.clients.remove);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);
  const [deletingId, setDeletingId] = useState<Id<"clients"> | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleEdit = (client: ClientData) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await deleteClient({ id: deletingId });
        setDeletingId(null);
        setDeleteError(null);
      } catch (error) {
        setDeleteError(
          error instanceof Error ? error.message : "Failed to delete client"
        );
      }
    }
  };

  const handleSubmit = async (data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    company?: string;
    notes?: string;
  }) => {
    if (editingClient) {
      await updateClient({ id: editingClient._id, ...data });
    } else {
      await createClient(data);
    }
    setIsFormOpen(false);
    setEditingClient(null);
  };

  const isLoading = !clients;

  // Calculate totals
  const totals = {
    clients: clients?.length ?? 0,
    totalBilled: clients?.reduce((sum, c) => sum + (c.totalBilled ?? 0), 0) ?? 0,
    outstanding: clients?.reduce((sum, c) => sum + (c.outstanding ?? 0), 0) ?? 0,
  };

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Clients"
        subtitle={`${clients?.length ?? 0} client${clients?.length !== 1 ? "s" : ""}`}
        action={{ label: "Add Client", onClick: handleCreate }}
      />

      <div className="flex-1 overflow-y-auto space-y-6 p-6">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-bold">{totals.clients}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Billed</p>
            <p className="text-2xl font-bold text-primary">
              ${totals.totalBilled.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-secondary">
              ${totals.outstanding.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Clients Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-lg border border-border bg-muted"
              />
            ))}
          </div>
        ) : clients?.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <UsersIcon className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No clients yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first client to start creating invoices
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients?.map((client) => (
              <ClientCard
                key={client._id}
                client={client as ClientData}
                onEdit={() => handleEdit(client as ClientData)}
                onDelete={() => {
                  setDeletingId(client._id);
                  setDeleteError(null);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Client Form Dialog */}
      <ClientForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={editingClient}
        onSubmit={handleSubmit}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError ? (
                <span className="text-destructive">{deleteError}</span>
              ) : (
                "Are you sure you want to delete this client? This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {!deleteError && (
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

