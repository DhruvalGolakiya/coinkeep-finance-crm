"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { AccountsStep } from "@/components/onboarding/accounts-step";
import { RecurringStep } from "@/components/onboarding/recurring-step";
import { GoalsStep } from "@/components/onboarding/goals-step";
import { ReadyStep } from "@/components/onboarding/ready-step";
import { 
  Sparkle,
  Buildings,
  Globe,
  Gear,
  ArrowRight,
  ArrowLeft,
  Check,
  CurrencyCircleDollar,
  Briefcase,
  Storefront,
  Code,
  Palette,
  Wrench,
  Heart,
  GraduationCap,
  ShoppingCart,
  User,
  UsersThree,
  Target,
  Wallet,
  Repeat,
} from "@phosphor-icons/react";

type UseCase = "personal" | "freelancer" | "small_business" | "agency";

const USE_CASES = [
  { 
    value: "personal" as UseCase, 
    label: "Personal", 
    icon: User,
    description: "Track personal income, expenses, and savings goals",
    features: ["Budgeting", "Expense tracking", "Savings goals", "Spending insights"]
  },
  { 
    value: "freelancer" as UseCase, 
    label: "Freelancer", 
    icon: Briefcase,
    description: "Manage clients, invoices, and business expenses",
    features: ["Invoicing", "Client management", "Tax categories", "Business/Personal split"]
  },
  { 
    value: "small_business" as UseCase, 
    label: "Small Business", 
    icon: Storefront,
    description: "Full accounting for your growing business",
    features: ["Multi-account", "Financial reports", "Tax tracking", "Cash flow analysis"]
  },
  { 
    value: "agency" as UseCase, 
    label: "Agency", 
    icon: UsersThree,
    description: "Multi-client management and project billing",
    features: ["Client projects", "Team billing", "Detailed reports", "Multi-currency"]
  },
];

const BUSINESS_TYPES = [
  { value: "consulting", label: "Consulting", icon: Wrench },
  { value: "creative", label: "Creative/Design", icon: Palette },
  { value: "tech", label: "Tech/Software", icon: Code },
  { value: "ecommerce", label: "E-Commerce", icon: ShoppingCart },
  { value: "retail", label: "Retail", icon: Storefront },
  { value: "healthcare", label: "Healthcare", icon: Heart },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "other", label: "Other", icon: Briefcase },
];

const COUNTRIES = [
  { value: "US", label: "United States", currency: "USD" },
  { value: "GB", label: "United Kingdom", currency: "GBP" },
  { value: "CA", label: "Canada", currency: "CAD" },
  { value: "AU", label: "Australia", currency: "AUD" },
  { value: "DE", label: "Germany", currency: "EUR" },
  { value: "FR", label: "France", currency: "EUR" },
  { value: "IN", label: "India", currency: "INR" },
  { value: "JP", label: "Japan", currency: "JPY" },
  { value: "SG", label: "Singapore", currency: "SGD" },
  { value: "AE", label: "United Arab Emirates", currency: "AED" },
  { value: "BR", label: "Brazil", currency: "BRL" },
  { value: "MX", label: "Mexico", currency: "MXN" },
  { value: "NL", label: "Netherlands", currency: "EUR" },
  { value: "ES", label: "Spain", currency: "EUR" },
  { value: "IT", label: "Italy", currency: "EUR" },
  { value: "CH", label: "Switzerland", currency: "CHF" },
  { value: "NZ", label: "New Zealand", currency: "NZD" },
  { value: "ZA", label: "South Africa", currency: "ZAR" },
];

const CURRENCIES = [
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "GBP", label: "British Pound", symbol: "£" },
  { value: "INR", label: "Indian Rupee", symbol: "₹" },
  { value: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$" },
  { value: "JPY", label: "Japanese Yen", symbol: "¥" },
  { value: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { value: "AED", label: "UAE Dirham", symbol: "د.إ" },
  { value: "CHF", label: "Swiss Franc", symbol: "CHF" },
  { value: "BRL", label: "Brazilian Real", symbol: "R$" },
  { value: "MXN", label: "Mexican Peso", symbol: "$" },
  { value: "NZD", label: "New Zealand Dollar", symbol: "NZ$" },
  { value: "ZAR", label: "South African Rand", symbol: "R" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY", example: "12/31/2024" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY", example: "31/12/2024" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD", example: "2024-12-31" },
  { value: "DD.MM.YYYY", label: "DD.MM.YYYY", example: "31.12.2024" },
];

const FISCAL_YEARS = [
  { value: "january", label: "January" },
  { value: "april", label: "April" },
  { value: "july", label: "July" },
  { value: "october", label: "October" },
];

// All possible steps
const ALL_STEPS = [
  { id: "welcome", title: "Welcome", icon: Sparkle },
  { id: "usecase", title: "Use Case", icon: Target },
  { id: "business", title: "Business", icon: Buildings },
  { id: "location", title: "Location", icon: Globe },
  { id: "preferences", title: "Preferences", icon: Gear },
  { id: "accounts", title: "Accounts", icon: Wallet },
  { id: "recurring", title: "Recurring", icon: Repeat },
  { id: "goals", title: "Goals", icon: Target },
  { id: "ready", title: "Ready", icon: Check },
];

function getSteps(useCase: UseCase | null) {
  const steps = [
    { id: "welcome", title: "Welcome", icon: Sparkle },
    { id: "usecase", title: "Use Case", icon: Target },
  ];
  
  if (useCase && useCase !== "personal") {
    steps.push({ id: "business", title: "Business", icon: Buildings });
  }
  
  steps.push(
    { id: "location", title: "Location", icon: Globe },
    { id: "preferences", title: "Preferences", icon: Gear },
    { id: "accounts", title: "Accounts", icon: Wallet },
    { id: "recurring", title: "Recurring", icon: Repeat },
    { id: "goals", title: "Goals", icon: Target },
    { id: "ready", title: "Ready", icon: Check },
  );
  
  return steps;
}

interface AccountEntry {
  id: string;
  name: string;
  type: "bank" | "credit_card" | "cash" | "investment" | "asset";
  balance: string;
  isBusinessAccount: boolean;
  color: string;
  icon: string;
}

interface RecurringEntry {
  id: string;
  name: string;
  amount: string;
  type: "income" | "expense";
  frequency: "weekly" | "biweekly" | "monthly" | "yearly";
  enabled: boolean;
  icon: string;
  color: string;
}

interface GoalEntry {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  enabled: boolean;
  icon: string;
  color: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, updateOnboarding, completeOnboarding } = useAuth();
  
  const batchCreateAccounts = useMutation(api.accounts.batchCreate);
  const batchCreateRecurring = useMutation(api.recurring.batchCreate);
  const batchCreateGoals = useMutation(api.goals.batchCreate);
  
  const [currentStepId, setCurrentStepId] = useState("welcome");
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [useCase, setUseCase] = useState<UseCase | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [fiscalYearStart, setFiscalYearStart] = useState("january");
  
  // Extended onboarding state
  const [addedAccounts, setAddedAccounts] = useState<AccountEntry[]>([]);
  const [addedRecurring, setAddedRecurring] = useState<RecurringEntry[]>([]);
  const [addedGoals, setAddedGoals] = useState<GoalEntry[]>([]);
  const [createdAccountIds, setCreatedAccountIds] = useState<string[]>([]);
  
  // Track if data was already saved (prevent duplicates on back/next)
  const [accountsSaved, setAccountsSaved] = useState(false);
  const [recurringSaved, setRecurringSaved] = useState(false);
  const [goalsSaved, setGoalsSaved] = useState(false);

  const steps = getSteps(useCase);
  const currentStepIndex = steps.findIndex(s => s.id === currentStepId);
  const totalSteps = steps.length;
  
  const currencySymbol = CURRENCIES.find(c => c.value === currency)?.symbol || "$";

  // Redirect if already onboarded
  useEffect(() => {
    if (!authLoading && user?.onboardingCompleted) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  // Load existing data
  useEffect(() => {
    if (user) {
      if (user.useCase) setUseCase(user.useCase);
      if (user.businessName) setBusinessName(user.businessName);
      if (user.businessType) setBusinessType(user.businessType);
      if (user.country) setCountry(user.country);
      if (user.currency) setCurrency(user.currency);
      if (user.dateFormat) setDateFormat(user.dateFormat);
      if (user.fiscalYearStart) setFiscalYearStart(user.fiscalYearStart);
    }
  }, [user]);

  // Auto-set currency when country changes
  useEffect(() => {
    const selectedCountry = COUNTRIES.find(c => c.value === country);
    if (selectedCountry && !currency) {
      setCurrency(selectedCountry.currency);
    }
  }, [country, currency]);

  const goToStep = (stepId: string) => {
    setCurrentStepId(stepId);
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStepId(steps[nextIndex].id);
    }
  };

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStepId(steps[prevIndex].id);
    }
  };

  // Handle preferences step completion (save base data)
  const handlePreferencesNext = async () => {
    setIsLoading(true);
    try {
      await updateOnboarding(5, { 
        useCase: useCase!,
        businessName, 
        businessType,
        country,
        currency,
        dateFormat, 
        fiscalYearStart 
      });
      goToNextStep();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle accounts step
  const handleAccountsNext = async (accounts: AccountEntry[]) => {
    setIsLoading(true);
    try {
      setAddedAccounts(accounts);
      
      // Only create if not already saved
      if (accounts.length > 0 && !accountsSaved) {
        const accountsToCreate = accounts.map(a => ({
          name: a.name,
          type: a.type,
          balance: parseFloat(a.balance) || 0,
          currency: currency,
          isBusinessAccount: a.isBusinessAccount,
          color: a.color,
          icon: a.icon,
        }));
        
        const ids = await batchCreateAccounts({ accounts: accountsToCreate });
        setCreatedAccountIds(ids);
        setAccountsSaved(true);
      }
      
      goToNextStep();
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate smart due date based on frequency
  const calculateFirstDueDate = (frequency: string): number => {
    const now = new Date();
    const result = new Date();
    
    switch (frequency) {
      case "daily":
        result.setDate(now.getDate() + 1);
        break;
      case "weekly":
        // Next week same day
        result.setDate(now.getDate() + 7);
        break;
      case "biweekly":
        // Two weeks from now
        result.setDate(now.getDate() + 14);
        break;
      case "monthly":
        // 1st of next month
        result.setMonth(now.getMonth() + 1);
        result.setDate(1);
        break;
      case "yearly":
        // 1st of next year
        result.setFullYear(now.getFullYear() + 1);
        result.setMonth(0);
        result.setDate(1);
        break;
      default:
        result.setDate(now.getDate() + 30);
    }
    
    return result.getTime();
  };

  // Handle recurring step
  const handleRecurringNext = async (recurring: RecurringEntry[]) => {
    setIsLoading(true);
    try {
      setAddedRecurring(recurring);
      
      // Only create if not already saved
      if (recurring.length > 0 && createdAccountIds.length > 0 && !recurringSaved) {
        const defaultAccountId = createdAccountIds[0];
        
        const transactionsToCreate = recurring.map(r => ({
          accountId: defaultAccountId as any,
          type: r.type,
          amount: parseFloat(r.amount) || 0,
          description: r.name,
          frequency: r.frequency,
          nextDueDate: calculateFirstDueDate(r.frequency),
        }));
        
        await batchCreateRecurring({ transactions: transactionsToCreate });
        setRecurringSaved(true);
      }
      
      goToNextStep();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle goals step
  const handleGoalsNext = async (goals: GoalEntry[]) => {
    setIsLoading(true);
    try {
      setAddedGoals(goals);
      
      // Only create if not already saved
      if (goals.length > 0 && !goalsSaved) {
        const goalsToCreate = goals.map(g => ({
          name: g.name,
          targetAmount: parseFloat(g.targetAmount) || 0,
          currentAmount: parseFloat(g.currentAmount) || 0,
          color: g.color,
          icon: g.icon,
        }));
        
        await batchCreateGoals({ goals: goalsToCreate });
        setGoalsSaved(true);
      }
      
      goToNextStep();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle finish
  const handleFinish = async () => {
    setIsLoading(true);
    try {
      await completeOnboarding();
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary for ready step
  const totalBalance = addedAccounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);
  const monthlyIncome = addedRecurring
    .filter(r => r.type === "income")
    .reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0;
      if (r.frequency === "yearly") return sum + amount / 12;
      if (r.frequency === "weekly") return sum + amount * 4;
      if (r.frequency === "biweekly") return sum + amount * 2;
      return sum + amount;
    }, 0);
  const monthlyExpenses = addedRecurring
    .filter(r => r.type === "expense")
    .reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0;
      if (r.frequency === "yearly") return sum + amount / 12;
      if (r.frequency === "weekly") return sum + amount * 4;
      if (r.frequency === "biweekly") return sum + amount * 2;
      return sum + amount;
    }, 0);

  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-primary flex items-center justify-center">
              <CurrencyCircleDollar className="size-5 text-primary-foreground" weight="fill" />
            </div>
            <span className="font-semibold">CoinKeep</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step {currentStepIndex + 1} of {totalSteps}</span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex">
            {steps.map((_, index) => (
              <div key={index} className="flex-1 relative">
                <div 
                  className={`h-1 transition-colors ${
                    index <= currentStepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {currentStepId === "welcome" && (
            <WelcomeStep 
              userName={user?.name || ""} 
              onNext={() => goToStep("usecase")} 
            />
          )}
          
          {currentStepId === "usecase" && (
            <UseCaseStep
              useCase={useCase}
              setUseCase={setUseCase}
              onNext={() => {
                if (useCase === "personal") {
                  goToStep("location");
                } else {
                  goToStep("business");
                }
              }}
              onBack={goToPrevStep}
              isLoading={isLoading}
            />
          )}
          
          {currentStepId === "business" && (
            <BusinessStep
              useCase={useCase!}
              businessName={businessName}
              setBusinessName={setBusinessName}
              businessType={businessType}
              setBusinessType={setBusinessType}
              onNext={() => goToStep("location")}
              onBack={goToPrevStep}
              isLoading={isLoading}
            />
          )}
          
          {currentStepId === "location" && (
            <LocationStep
              country={country}
              setCountry={setCountry}
              currency={currency}
              setCurrency={setCurrency}
              onNext={() => goToStep("preferences")}
              onBack={goToPrevStep}
              isLoading={isLoading}
            />
          )}
          
          {currentStepId === "preferences" && (
            <PreferencesStep
              useCase={useCase!}
              dateFormat={dateFormat}
              setDateFormat={setDateFormat}
              fiscalYearStart={fiscalYearStart}
              setFiscalYearStart={setFiscalYearStart}
              onNext={handlePreferencesNext}
              onBack={goToPrevStep}
              isLoading={isLoading}
            />
          )}
          
          {currentStepId === "accounts" && (
            <AccountsStep
              useCase={useCase || "personal"}
              currency={currency}
              currencySymbol={currencySymbol}
              onNext={handleAccountsNext}
              onBack={goToPrevStep}
              onSkip={() => goToNextStep()}
              isLoading={isLoading}
            />
          )}
          
          {currentStepId === "recurring" && (
            <RecurringStep
              useCase={useCase || "personal"}
              currencySymbol={currencySymbol}
              onNext={handleRecurringNext}
              onBack={goToPrevStep}
              onSkip={() => goToNextStep()}
              isLoading={isLoading}
            />
          )}
          
          {currentStepId === "goals" && (
            <GoalsStep
              useCase={useCase || "personal"}
              currencySymbol={currencySymbol}
              onNext={handleGoalsNext}
              onBack={goToPrevStep}
              onSkip={() => goToNextStep()}
              isLoading={isLoading}
            />
          )}
          
          {currentStepId === "ready" && (
            <ReadyStep
              accountsCount={addedAccounts.length}
              recurringCount={addedRecurring.length}
              goalsCount={addedGoals.length}
              totalBalance={totalBalance}
              monthlyIncome={monthlyIncome}
              monthlyExpenses={monthlyExpenses}
              currencySymbol={currencySymbol}
              onFinish={handleFinish}
              onBack={goToPrevStep}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Step indicators */}
      <footer className="border-t px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-center gap-4 overflow-x-auto">
          {steps.slice(0, 7).map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStepId;
            const isPast = index < currentStepIndex;
            
            return (
              <div 
                key={step.id}
                className={`flex items-center gap-2 text-xs shrink-0 ${
                  isActive 
                    ? "text-foreground" 
                    : isPast 
                      ? "text-primary" 
                      : "text-muted-foreground"
                }`}
              >
                <div className={`size-6 rounded-full flex items-center justify-center ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : isPast 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                }`}>
                  {isPast ? (
                    <Check className="size-3" weight="bold" />
                  ) : (
                    <Icon className="size-3" />
                  )}
                </div>
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            );
          })}
          {steps.length > 7 && (
            <span className="text-xs text-muted-foreground">+{steps.length - 7}</span>
          )}
        </div>
      </footer>
    </div>
  );
}

// Welcome Step Component
function WelcomeStep({ 
  userName, 
  onNext 
}: { 
  userName: string; 
  onNext: () => void;
}) {
  return (
    <Card className="border-0 ring-0 shadow-none bg-transparent text-center">
      <CardHeader className="pb-6">
        <div className="mx-auto mb-4 size-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Sparkle className="size-8 text-primary" weight="duotone" />
        </div>
        <CardTitle className="text-2xl">
          Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}!
        </CardTitle>
        <CardDescription className="text-base max-w-sm mx-auto">
          Let&apos;s set up your financial dashboard. This will take about 2-3 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="p-4 bg-muted/50 rounded-sm">
            <Target className="size-5 text-primary mb-2" weight="duotone" />
            <h3 className="text-sm font-medium">Your Use Case</h3>
            <p className="text-xs text-muted-foreground">Personal or business?</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-sm">
            <Globe className="size-5 text-primary mb-2" weight="duotone" />
            <h3 className="text-sm font-medium">Your Region</h3>
            <p className="text-xs text-muted-foreground">Set currency & formats</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-sm">
            <Wallet className="size-5 text-primary mb-2" weight="duotone" />
            <h3 className="text-sm font-medium">Your Accounts</h3>
            <p className="text-xs text-muted-foreground">Add existing balances</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-sm">
            <Repeat className="size-5 text-primary mb-2" weight="duotone" />
            <h3 className="text-sm font-medium">Recurring</h3>
            <p className="text-xs text-muted-foreground">Bills & income</p>
          </div>
        </div>
        
        <Button onClick={onNext} className="w-full h-10 gap-2">
          <span>Get Started</span>
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// Use Case Step Component
function UseCaseStep({
  useCase,
  setUseCase,
  onNext,
  onBack,
  isLoading,
}: {
  useCase: UseCase | null;
  setUseCase: (value: UseCase) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  return (
    <Card className="border-0 ring-0 shadow-none bg-transparent">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">How will you use CoinKeep?</CardTitle>
        <CardDescription>
          We&apos;ll customize your experience based on your needs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            const isSelected = useCase === uc.value;
            return (
              <button
                key={uc.value}
                type="button"
                onClick={() => setUseCase(uc.value)}
                disabled={isLoading}
                className={`p-4 text-left rounded-sm border transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`size-10 rounded-sm flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <Icon className="size-5" weight={isSelected ? "fill" : "regular"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{uc.label}</span>
                      {isSelected && (
                        <Check className="size-4 text-primary" weight="bold" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{uc.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {uc.features.map((feature) => (
                        <span 
                          key={feature} 
                          className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                            isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="h-10"
            disabled={isLoading}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button 
            onClick={onNext} 
            className="flex-1 h-10 gap-2"
            disabled={!useCase || isLoading}
          >
            {isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Business Step Component
function BusinessStep({
  useCase,
  businessName,
  setBusinessName,
  businessType,
  setBusinessType,
  onNext,
  onBack,
  isLoading,
}: {
  useCase: UseCase;
  businessName: string;
  setBusinessName: (value: string) => void;
  businessType: string;
  setBusinessType: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const isRequired = useCase === "small_business" || useCase === "agency";
  
  return (
    <Card className="border-0 ring-0 shadow-none bg-transparent">
      <CardHeader>
        <CardTitle className="text-xl">Tell us about your business</CardTitle>
        <CardDescription>
          {isRequired 
            ? "This information helps us set up your accounts correctly" 
            : "Optional - you can skip this or fill it in later"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Business Name {!isRequired && "(optional)"}
          </label>
          <Input
            type="text"
            placeholder={useCase === "freelancer" ? "Your Name or Brand" : "Acme Inc."}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="h-10"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            What type of {useCase === "freelancer" ? "work" : "business"}?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setBusinessType(type.value)}
                  disabled={isLoading}
                  className={`p-3 text-left rounded-sm border transition-colors ${
                    businessType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className={`size-4 mb-1 ${
                    businessType === type.value ? "text-primary" : "text-muted-foreground"
                  }`} />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="h-10"
            disabled={isLoading}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button 
            onClick={onNext} 
            className="flex-1 h-10 gap-2"
            disabled={isLoading || (isRequired && !businessName)}
          >
            {isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <>
                <span>{!isRequired && !businessName && !businessType ? "Skip" : "Continue"}</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Location Step Component  
function LocationStep({
  country,
  setCountry,
  currency,
  setCurrency,
  onNext,
  onBack,
  isLoading,
}: {
  country: string;
  setCountry: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  return (
    <Card className="border-0 ring-0 shadow-none bg-transparent">
      <CardHeader>
        <CardTitle className="text-xl">Where are you located?</CardTitle>
        <CardDescription>
          We&apos;ll set your default currency and formats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Country
          </label>
          <Select value={country} onValueChange={(value) => setCountry(value ?? "")}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Primary Currency
          </label>
          <Select value={currency} onValueChange={(value) => setCurrency(value ?? "")}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-muted-foreground">{c.symbol}</span>
                    <span>{c.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="h-10"
            disabled={isLoading}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button 
            onClick={onNext} 
            className="flex-1 h-10 gap-2"
            disabled={!country || !currency || isLoading}
          >
            {isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Preferences Step Component
function PreferencesStep({
  useCase,
  dateFormat,
  setDateFormat,
  fiscalYearStart,
  setFiscalYearStart,
  onNext,
  onBack,
  isLoading,
}: {
  useCase: UseCase;
  dateFormat: string;
  setDateFormat: (value: string) => void;
  fiscalYearStart: string;
  setFiscalYearStart: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  const showFiscalYear = useCase !== "personal";
  
  return (
    <Card className="border-0 ring-0 shadow-none bg-transparent">
      <CardHeader>
        <CardTitle className="text-xl">Set your preferences</CardTitle>
        <CardDescription>
          You can always change these later in settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Date Format
          </label>
          <Select value={dateFormat} onValueChange={(value) => setDateFormat(value ?? "")}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  <span className="inline-flex items-center gap-3">
                    <span>{f.label}</span>
                    <span className="text-muted-foreground text-xs">({f.example})</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showFiscalYear && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Fiscal Year Starts In
            </label>
            <Select value={fiscalYearStart} onValueChange={(value) => setFiscalYearStart(value ?? "")}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FISCAL_YEARS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This affects how your yearly reports are calculated
            </p>
          </div>
        )}

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm">
          <h4 className="text-sm font-medium mb-2">Next: Set up your accounts</h4>
          <p className="text-xs text-muted-foreground">
            Add your existing bank accounts, credit cards, and starting balances.
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="h-10"
            disabled={isLoading}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <Button 
            onClick={onNext} 
            className="flex-1 h-10 gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className="size-4" />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
