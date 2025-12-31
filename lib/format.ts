"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { format as dateFnsFormat, parseISO } from "date-fns";

/**
 * Hook to get a currency formatting function based on user preferences
 */
export function useFormatCurrency() {
  const { user } = useAuth();
  const currency = user?.currency || "USD";

  return (amount: number, options?: { compact?: boolean }) => {
    if (options?.compact) {
      // Compact format for large numbers (e.g., $10.5k, $1.2M)
      const absAmount = Math.abs(amount);
      if (absAmount >= 1000000) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(amount);
      }
      if (absAmount >= 1000) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          notation: "compact",
          maximumFractionDigits: 1,
        }).format(amount);
      }
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };
}

/**
 * Hook to get currency symbol based on user preferences
 */
export function useCurrencySymbol() {
  const { user } = useAuth();
  const currency = user?.currency || "USD";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value || "$";
}

/**
 * Map of date format patterns from user preferences to date-fns format strings
 */
const DATE_FORMAT_MAP: Record<string, string> = {
  "MM/DD/YYYY": "MM/dd/yyyy",
  "DD/MM/YYYY": "dd/MM/yyyy",
  "YYYY-MM-DD": "yyyy-MM-dd",
  "DD.MM.YYYY": "dd.MM.yyyy",
};

/**
 * Hook to get a date formatting function based on user preferences
 */
export function useFormatDate() {
  const { user } = useAuth();
  const userFormat = user?.dateFormat || "MM/DD/YYYY";
  const formatPattern = DATE_FORMAT_MAP[userFormat] || "MM/dd/yyyy";

  return (date: Date | number | string, customFormat?: string) => {
    const dateObj =
      typeof date === "string"
        ? parseISO(date)
        : typeof date === "number"
          ? new Date(date)
          : date;

    return dateFnsFormat(dateObj, customFormat || formatPattern);
  };
}

/**
 * Hook to format date with time
 */
export function useFormatDateTime() {
  const { user } = useAuth();
  const userFormat = user?.dateFormat || "MM/DD/YYYY";
  const formatPattern = DATE_FORMAT_MAP[userFormat] || "MM/dd/yyyy";

  return (date: Date | number | string) => {
    const dateObj =
      typeof date === "string"
        ? parseISO(date)
        : typeof date === "number"
          ? new Date(date)
          : date;

    return dateFnsFormat(dateObj, `${formatPattern} h:mm a`);
  };
}

/**
 * Hook to format relative date (e.g., "Today", "Yesterday", "Jan 15")
 */
export function useFormatRelativeDate() {
  const formatDate = useFormatDate();

  return (date: Date | number | string) => {
    const dateObj =
      typeof date === "string"
        ? parseISO(date)
        : typeof date === "number"
          ? new Date(date)
          : date;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const inputDate = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate()
    );

    if (inputDate.getTime() === today.getTime()) {
      return "Today";
    }
    if (inputDate.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }

    // If same year, show "Jan 15", otherwise "Jan 15, 2024"
    if (dateObj.getFullYear() === now.getFullYear()) {
      return dateFnsFormat(dateObj, "MMM d");
    }
    return dateFnsFormat(dateObj, "MMM d, yyyy");
  };
}

/**
 * Get user's currency code
 */
export function useUserCurrency() {
  const { user } = useAuth();
  return user?.currency || "USD";
}

/**
 * Format amount with a specific currency (not user's default)
 */
export function formatCurrencyAmount(
  amount: number,
  currencyCode: string,
  options?: { compact?: boolean }
): string {
  if (options?.compact) {
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(amount);
    }
    if (absAmount >= 1000) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(amount);
    }
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get currency symbol for any currency code
 */
export function getCurrencySymbolFor(currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value || currencyCode;
}
