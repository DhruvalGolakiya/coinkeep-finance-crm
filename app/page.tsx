"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Spinner } from "@/components/ui/spinner";
import { CurrencyCircleDollar } from "@phosphor-icons/react";

export default function RootPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      // Not logged in, go to login
      router.replace("/login");
    } else if (user && !user.onboardingCompleted) {
      // Logged in but not onboarded
      router.replace("/onboarding");
    } else if (user && user.onboardingCompleted) {
      // Fully onboarded, go to dashboard
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background gap-4">
      <div className="flex items-center gap-3">
        <div className="size-10 bg-primary flex items-center justify-center">
          <CurrencyCircleDollar className="size-6 text-primary-foreground" weight="fill" />
        </div>
        <span className="text-xl font-semibold">FinanceFlow</span>
      </div>
      <Spinner className="size-6" />
    </div>
  );
}
