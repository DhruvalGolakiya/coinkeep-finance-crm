"use client";

const CACHE_KEY = "exchange_rates_cache";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

interface ExchangeRateCache {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

/**
 * Get cached exchange rates from localStorage
 */
function getCachedRates(baseCurrency: string): ExchangeRateCache | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = localStorage.getItem(`${CACHE_KEY}_${baseCurrency}`);
    if (!cached) return null;

    const data: ExchangeRateCache = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (within 1 hour)
    if (now - data.timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expired, remove it
    localStorage.removeItem(`${CACHE_KEY}_${baseCurrency}`);
    return null;
  } catch {
    return null;
  }
}

/**
 * Cache exchange rates in localStorage
 */
function cacheRates(baseCurrency: string, rates: Record<string, number>): void {
  if (typeof window === "undefined") return;

  try {
    const data: ExchangeRateCache = {
      base: baseCurrency,
      rates,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_KEY}_${baseCurrency}`, JSON.stringify(data));
  } catch {
    // localStorage might be full or disabled
  }
}

/**
 * Fetch exchange rates from API
 * Uses exchangerate-api.com free tier (1500 requests/month)
 */
export async function fetchExchangeRates(
  baseCurrency: string
): Promise<Record<string, number> | null> {
  // Check cache first
  const cached = getCachedRates(baseCurrency);
  if (cached) {
    return cached.rates;
  }

  try {
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );

    if (!response.ok) {
      console.error("Failed to fetch exchange rates:", response.statusText);
      return null;
    }

    const data = await response.json();
    const rates = data.rates as Record<string, number>;

    // Cache the rates
    cacheRates(baseCurrency, rates);

    return rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    return null;
  }
}

/**
 * Get exchange rate between two currencies
 * Returns the rate to multiply fromCurrency amount to get toCurrency amount
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const rates = await fetchExchangeRates(fromCurrency);
  if (!rates) return null;

  return rates[toCurrency] || null;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  exchangeRate: number
): number {
  return Math.round(amount * exchangeRate * 100) / 100;
}

/**
 * Format exchange rate for display
 * e.g., "1 USD = 83.50 INR"
 */
export function formatExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number
): string {
  return `1 ${fromCurrency} = ${rate.toFixed(2)} ${toCurrency}`;
}

/**
 * Common currency symbols
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
  CNY: "¥",
  SGD: "S$",
  AED: "د.إ",
  BRL: "R$",
  MXN: "$",
  NZD: "NZ$",
  ZAR: "R",
  KRW: "₩",
  THB: "฿",
  HKD: "HK$",
  SEK: "kr",
  NOK: "kr",
};

/**
 * Get currency symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}

/**
 * Format amount with currency symbol
 */
export function formatAmountWithCurrency(
  amount: number,
  currencyCode: string,
  options?: { compact?: boolean }
): string {
  if (options?.compact) {
    const absAmount = Math.abs(amount);
    const symbol = getCurrencySymbol(currencyCode);
    if (absAmount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    }
    if (absAmount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(1)}k`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
