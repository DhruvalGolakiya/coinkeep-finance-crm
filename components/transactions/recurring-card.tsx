"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DotsThreeVertical,
  PencilSimple,
  Trash,
  Pause,
  Play,
  Check,
  FastForward,
  ArrowUp,
  ArrowDown,
  CalendarBlank
} from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Id } from "@/convex/_generated/dataModel";
import { format } from "date-fns";

interface RecurringCardProps {
  recurring: {
    _id: Id<"recurringTransactions">;
    type: "income" | "expense";
    amount: number;
    description: string;
    frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
    nextDueDate: number;
    isActive: boolean;
    daysUntilDue: number;
    isOverdue: boolean;
    isDueToday: boolean;
    isDueSoon: boolean;
    account: { name: string; color?: string } | null;
    category: { name: string; color: string; icon: string } | null;
  };
  currency: string;
  onEdit: (id: Id<"recurringTransactions">) => void;
  onDelete: (id: Id<"recurringTransactions">) => void;
  onToggleActive: (id: Id<"recurringTransactions">) => void;
  onProcess: (id: Id<"recurringTransactions">) => void;
  onSkip: (id: Id<"recurringTransactions">) => void;
}

export function RecurringCard({ 
  recurring, 
  currency,
  onEdit, 
  onDelete, 
  onToggleActive,
  onProcess,
  onSkip
}: RecurringCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const frequencyLabel = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Every 2 weeks",
    monthly: "Monthly",
    yearly: "Yearly",
  }[recurring.frequency];

  const getDueDateLabel = () => {
    if (recurring.isOverdue) {
      return `${Math.abs(recurring.daysUntilDue)} days overdue`;
    }
    if (recurring.isDueToday) {
      return "Due today";
    }
    if (recurring.daysUntilDue === 1) {
      return "Due tomorrow";
    }
    return `Due in ${recurring.daysUntilDue} days`;
  };

  return (
    <div className={`flex items-center gap-3 p-3 border rounded-sm bg-card hover:bg-muted/30 transition-colors ${!recurring.isActive ? "opacity-60" : ""}`}>
      {/* Icon */}
      <div 
        className={`size-8 rounded-sm flex items-center justify-center shrink-0 ${
          recurring.type === "income" 
            ? "bg-green-500/10 text-green-600" 
            : "bg-red-500/10 text-red-600"
        }`}
      >
        {recurring.type === "income" ? (
          <ArrowDown className="size-4" weight="bold" />
        ) : (
          <ArrowUp className="size-4" weight="bold" />
        )}
      </div>
      
      {/* Description & Account */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {recurring.description}
          </span>
          {!recurring.isActive && (
            <Badge variant="outline" className="text-[10px]">Paused</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{recurring.account?.name || "Unknown"}</span>
          <span>•</span>
          <span>{frequencyLabel}</span>
        </div>
      </div>
      
      {/* Due Date */}
      <div className="hidden sm:flex items-center gap-1.5 shrink-0">
        <CalendarBlank className="size-3 text-muted-foreground" />
        <span className={`text-xs ${
          recurring.isOverdue 
            ? "text-destructive font-medium" 
            : recurring.isDueToday || recurring.isDueSoon
              ? "text-yellow-600 font-medium"
              : "text-muted-foreground"
        }`}>
          {getDueDateLabel()} ({format(recurring.nextDueDate, "MMM d")})
        </span>
      </div>

      {/* Amount */}
      <span className={`text-sm font-semibold tabular-nums shrink-0 ${
        recurring.type === "income" ? "text-green-600" : "text-red-600"
      }`}>
        {recurring.type === "income" ? "+" : "-"}{formatCurrency(recurring.amount)}
      </span>
      
      {/* Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger className="p-1 hover:bg-muted rounded-sm shrink-0">
          <DotsThreeVertical className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {recurring.isActive && (
            <>
              <DropdownMenuItem onClick={() => onProcess(recurring._id)}>
                <Check className="size-4 mr-2" />
                Record Transaction
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSkip(recurring._id)}>
                <FastForward className="size-4 mr-2" />
                Skip This Time
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={() => onEdit(recurring._id)}>
            <PencilSimple className="size-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggleActive(recurring._id)}>
            {recurring.isActive ? (
              <>
                <Pause className="size-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="size-4 mr-2" />
                Resume
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onDelete(recurring._id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="size-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
