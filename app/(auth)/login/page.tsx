"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { 
  ChartLineUp, 
  CurrencyCircleDollar, 
  Invoice, 
  Users,
  Envelope,
  User,
  ArrowRight
} from "@phosphor-icons/react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), name.trim());
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="size-10 bg-primary flex items-center justify-center">
              <CurrencyCircleDollar className="size-6 text-primary-foreground" weight="fill" />
            </div>
            <span className="text-xl font-semibold text-sidebar-foreground">CoinKeep</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-serif font-bold text-sidebar-foreground leading-tight">
              Your complete finance<br />management solution
            </h1>
            <p className="text-sidebar-foreground/70 text-lg max-w-md">
              Track expenses, manage invoices, and gain insights into your business finances.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FeatureCard 
            icon={<ChartLineUp className="size-5" weight="duotone" />}
            title="Analytics"
            description="Real-time insights into your finances"
          />
          <FeatureCard 
            icon={<Invoice className="size-5" weight="duotone" />}
            title="Invoicing"
            description="Professional invoices in seconds"
          />
          <FeatureCard 
            icon={<Users className="size-5" weight="duotone" />}
            title="Clients"
            description="Manage all your client relationships"
          />
          <FeatureCard 
            icon={<CurrencyCircleDollar className="size-5" weight="duotone" />}
            title="Multi-Currency"
            description="Support for global transactions"
          />
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="size-10 bg-primary flex items-center justify-center">
              <CurrencyCircleDollar className="size-6 text-primary-foreground" weight="fill" />
            </div>
            <span className="text-xl font-semibold">CoinKeep</span>
          </div>

          <Card className="border-0 ring-0 shadow-none bg-transparent">
            <CardHeader className="px-0">
              <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
              <CardDescription className="text-sm">
                Enter your details to access your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email Address
                  </label>
                  <div className="relative">
                    <Envelope className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-xs text-destructive bg-destructive/10 p-3 rounded-sm">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-10 gap-2" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner className="size-4" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-6">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="bg-sidebar-accent/50 p-4 rounded-sm">
      <div className="text-sidebar-primary mb-2">{icon}</div>
      <h3 className="text-sm font-medium text-sidebar-foreground mb-1">{title}</h3>
      <p className="text-xs text-sidebar-foreground/60">{description}</p>
    </div>
  );
}
