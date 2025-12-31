"use client";

import { useRef } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DownloadSimpleIcon, PrinterIcon } from "@phosphor-icons/react";
import { jsPDF } from "jspdf";

interface InvoicePreviewProps {
  invoice: {
    invoiceNumber: string;
    status: "draft" | "sent" | "paid" | "overdue";
    currency?: string;
    items: Array<{
      description: string;
      quantity: number;
      rate: number;
      amount: number;
    }>;
    issueDate: number;
    dueDate: number;
    subtotal: number;
    tax: number;
    taxRate: number;
    total: number;
    notes?: string;
    client?: { name: string; email?: string; address?: string } | null;
  };
  onClose: () => void;
}

const statusConfig = {
  draft: { label: "Draft", color: "text-muted-foreground", bgColor: "bg-muted" },
  sent: { label: "Sent", color: "text-primary", bgColor: "bg-primary-soft" },
  paid: { label: "Paid", color: "text-primary", bgColor: "bg-primary/10" },
  overdue: { label: "Overdue", color: "text-destructive", bgColor: "bg-destructive/10" },
};

function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function InvoicePreview({ invoice, onClose }: InvoicePreviewProps) {
  const config = statusConfig[invoice.status];
  const invoiceRef = useRef<HTMLDivElement>(null);
  const currency = invoice.currency || "USD";

  // Helper to format with invoice currency
  const formatAmount = (amount: number) => formatCurrency(amount, currency);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Header - Invoice number
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229); // Primary color
    doc.text(invoice.invoiceNumber, margin, y);

    // Status badge
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(config.label.toUpperCase(), pageWidth - margin - 20, y);

    y += 15;

    // Bill To section
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Bill To:", margin, y);
    y += 6;
    
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text(invoice.client?.name ?? "Unknown Client", margin, y);
    y += 5;
    
    if (invoice.client?.email) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(invoice.client.email, margin, y);
      y += 5;
    }
    
    if (invoice.client?.address) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const addressLines = doc.splitTextToSize(invoice.client.address, 80);
      doc.text(addressLines, margin, y);
      y += addressLines.length * 5;
    }

    // Dates on the right
    const dateX = pageWidth - margin - 50;
    let dateY = 35;
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Issue Date:", dateX, dateY);
    dateY += 5;
    doc.setTextColor(30, 30, 30);
    doc.text(formatDate(invoice.issueDate), dateX, dateY);
    dateY += 10;
    doc.setTextColor(120, 120, 120);
    doc.text("Due Date:", dateX, dateY);
    dateY += 5;
    doc.setTextColor(30, 30, 30);
    doc.text(formatDate(invoice.dueDate), dateX, dateY);

    y = Math.max(y, dateY) + 15;

    // Line items header
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Description", margin, y);
    doc.text("Qty", pageWidth - margin - 70, y, { align: "right" });
    doc.text("Rate", pageWidth - margin - 40, y, { align: "right" });
    doc.text("Amount", pageWidth - margin, y, { align: "right" });
    
    y += 8;

    // Line items
    doc.setTextColor(30, 30, 30);
    invoice.items.forEach((item) => {
      // Check if we need a new page
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const descLines = doc.splitTextToSize(item.description, 80);
      doc.text(descLines, margin, y);
      doc.text(item.quantity.toString(), pageWidth - margin - 70, y, { align: "right" });
      doc.text(formatAmount(item.rate), pageWidth - margin - 40, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(formatAmount(item.amount), pageWidth - margin, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      
      y += Math.max(descLines.length * 5, 8) + 4;
    });

    y += 5;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Totals section
    const totalsX = pageWidth - margin - 60;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Subtotal:", totalsX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(formatAmount(invoice.subtotal), pageWidth - margin, y, { align: "right" });
    y += 7;

    doc.setTextColor(100, 100, 100);
    doc.text(`Tax (${invoice.taxRate}%):`, totalsX, y);
    doc.setTextColor(30, 30, 30);
    doc.text(formatAmount(invoice.tax), pageWidth - margin, y, { align: "right" });
    y += 10;

    // Total
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(totalsX - 10, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229);
    doc.setFont("helvetica", "bold");
    doc.text(`Total (${currency}):`, totalsX, y);
    doc.text(formatAmount(invoice.total), pageWidth - margin, y, { align: "right" });
    doc.setFont("helvetica", "normal");

    // Notes
    if (invoice.notes) {
      y += 20;
      
      // Check if we need a new page
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(249, 250, 251);
      doc.roundedRect(margin, y - 5, pageWidth - 2 * margin, 30, 3, 3, "F");
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Notes:", margin + 5, y + 3);
      
      doc.setTextColor(60, 60, 60);
      const noteLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin - 10);
      doc.text(noteLines, margin + 5, y + 10);
    }

    // Save the PDF
    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                padding: 60px 40px;
                color: #1a1a1a;
                background: #ffffff;
              }
              .invoice-container { max-width: 800px; margin: 0 auto; }
              .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
              .invoice-number { font-size: 24px; font-weight: bold; color: #4f46e5; }
              .bill-to { text-align: right; }
              .client-name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
              .line-items { margin: 40px 0; }
              .line-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
              .line-item:last-child { border-bottom: none; }
              .totals { margin-left: auto; width: 250px; }
              .total-row { display: flex; justify-content: space-between; padding: 12px 0; }
              .grand-total { font-size: 24px; font-weight: bold; color: #4f46e5; border-top: 2px solid #4f46e5; padding-top: 16px; margin-top: 12px; }
              .notes { background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 40px; }
              .date-info { margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="invoice-header">
                <div class="invoice-number">${invoice.invoiceNumber}</div>
                <div class="bill-to">
                  <div class="client-name">${invoice.client?.name ?? "Unknown"}</div>
                  ${invoice.client?.email ? `<div>${invoice.client.email}</div>` : ""}
                  ${invoice.client?.address ? `<div>${invoice.client.address}</div>` : ""}
                </div>
              </div>
              <div class="date-info">
                <strong>Issue Date:</strong> ${formatDate(invoice.issueDate)}<br />
                <strong>Due Date:</strong> ${formatDate(invoice.dueDate)}
              </div>
              <div class="line-items">
                <div style="display: grid; grid-template-columns: 1fr auto auto auto; gap: 16px; padding-bottom: 12px; border-bottom: 2px solid #4f46e5; margin-bottom: 8px; font-size: 14px;">
                  <strong>Description</strong>
                  <strong>Qty</strong>
                  <strong>Rate</strong>
                  <strong>Amount</strong>
                </div>
                ${invoice.items.map(item => `
                  <div class="line-item">
                    <span>${item.description}</span>
                    <span>${item.quantity}</span>
                    <span>${formatAmount(item.rate)}</span>
                    <strong>${formatAmount(item.amount)}</strong>
                  </div>
                `).join('')}
              </div>
              <div class="totals">
                <div class="total-row"><strong>Subtotal:</strong> ${formatAmount(invoice.subtotal)}</div>
                <div class="total-row"><strong>Tax (${invoice.taxRate}%):</strong> ${formatAmount(invoice.tax)}</div>
                <div class="grand-total"><strong>Total (${currency}):</strong> ${formatAmount(invoice.total)}</div>
              </div>
              ${invoice.notes ? `
                <div class="notes">
                  <strong>Notes:</strong>
                  <p style="margin: 8px 0 0 0;">${invoice.notes}</p>
                </div>
              ` : ""}
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

   return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className="max-w-xl! max-h-[85vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <AlertDialogTitle className="font-mono text-lg">
                {invoice.invoiceNumber}
              </AlertDialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Invoice Preview</p>
            </div>
            <Badge
              variant="secondary"
              className={`${config.bgColor} ${config.color} ml-4`}
            >
              {config.label}
            </Badge>
          </div>
        </AlertDialogHeader>

        <div ref={invoiceRef} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs font-medium text-muted-foreground">Bill To</h4>
              <div className="mt-1">
                <p className="font-medium">{invoice.client?.name ?? "Unknown"}</p>
                {invoice.client?.email && (
                  <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
                )}
                {invoice.client?.address && (
                  <p className="text-sm text-muted-foreground">{invoice.client.address}</p>
                )}
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div>
                <p className="text-xs text-muted-foreground">Issue Date</p>
                <p className="text-sm">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Due Date</p>
                <p className="text-sm">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="grid grid-cols-12 gap-4 border-b border-border pb-2 text-xs font-medium text-muted-foreground mb-4">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Quantity</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            <div className="divide-y divide-border">
              {invoice.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 py-3 text-sm">
                  <div className="col-span-6">{item.description}</div>
                  <div className="col-span-2 text-right">{item.quantity}</div>
                  <div className="col-span-2 text-right">{formatAmount(item.rate)}</div>
                  <div className="col-span-2 text-right font-medium">{formatAmount(item.amount)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatAmount(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                <span>{formatAmount(invoice.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total ({currency})</span>
                <span>{formatAmount(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-lg bg-muted/50 p-4 mt-6">
              <p className="text-xs font-medium text-muted-foreground">Notes</p>
              <p className="mt-1 text-sm">{invoice.notes}</p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <Button onClick={handleDownloadPDF} className="gap-2">
            <DownloadSimpleIcon className="h-4 w-4" />
            Download PDF
          </Button>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
