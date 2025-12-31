"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type UseCase = "personal" | "freelancer" | "small_business" | "agency";

interface User {
  email: string;
  name: string;
  useCase?: UseCase;
  businessName?: string;
  businessType?: string;
  country: string;
  currency: string;
  timezone?: string;
  fiscalYearStart?: string;
  dateFormat?: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, name: string) => Promise<void>;
  logout: () => void;
  updateOnboarding: (step: number, data: Partial<User>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load email from localStorage on mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("crm_user_email");
    setEmail(storedEmail);
    setIsLoading(false);
  }, []);

  // Query user data from Convex
  const userData = useQuery(
    api.users.getByEmail,
    email ? { email } : "skip"
  );

  const createUser = useMutation(api.users.create);
  const updateOnboardingMutation = useMutation(api.users.updateOnboarding);
  const completeOnboardingMutation = useMutation(api.users.completeOnboarding);
  const seedUserDataMutation = useMutation(api.users.seedUserData);

  const login = async (email: string, name: string) => {
    await createUser({ email, name });
    localStorage.setItem("crm_user_email", email);
    localStorage.setItem("crm_user_name", name);
    setEmail(email);
  };

  const logout = () => {
    localStorage.removeItem("crm_user_email");
    localStorage.removeItem("crm_user_name");
    setEmail(null);
  };

  const updateOnboarding = async (step: number, data: Partial<User>) => {
    if (!email) return;
    await updateOnboardingMutation({
      email,
      step,
      data: {
        useCase: data.useCase,
        businessName: data.businessName,
        businessType: data.businessType,
        country: data.country,
        currency: data.currency,
        timezone: data.timezone,
        fiscalYearStart: data.fiscalYearStart,
        dateFormat: data.dateFormat,
      },
    });
  };

  const completeOnboarding = async () => {
    if (!email) return;
    await completeOnboardingMutation({ email });
    // Seed categories and accounts based on user's use case
    await seedUserDataMutation({ email });
  };

  const user: User | null = userData
    ? {
        email: userData.email,
        name: userData.name,
        useCase: userData.useCase,
        businessName: userData.businessName,
        businessType: userData.businessType,
        country: userData.country,
        currency: userData.currency,
        timezone: userData.timezone,
        fiscalYearStart: userData.fiscalYearStart,
        dateFormat: userData.dateFormat,
        onboardingCompleted: userData.onboardingCompleted,
        onboardingStep: userData.onboardingStep,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || (email !== null && userData === undefined),
        isAuthenticated: !!email && !!userData,
        login,
        logout,
        updateOnboarding,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
