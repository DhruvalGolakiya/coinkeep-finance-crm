"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HouseIcon,
  WalletIcon,
  ArrowsLeftRightIcon,
  UsersIcon,
  FileTextIcon,
  ChartLineIcon,
  GearIcon,
  CurrencyCircleDollarIcon,
  SignOutIcon,
  TargetIcon,
  RepeatIcon,
  ChartPieSliceIcon,
} from "@phosphor-icons/react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/providers/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UseCase = "personal" | "freelancer" | "small_business" | "agency";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string; weight?: "regular" | "fill" }>;
  useCases?: UseCase[]; // If undefined, show for all use cases
}

const mainNavigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: HouseIcon },
  { name: "Accounts", href: "/dashboard/accounts", icon: WalletIcon },
  { name: "Transactions", href: "/dashboard/transactions", icon: ArrowsLeftRightIcon },
  { name: "Budgets", href: "/dashboard/budgets", icon: ChartPieSliceIcon },
  { name: "Recurring", href: "/dashboard/recurring", icon: RepeatIcon },
  { name: "Goals", href: "/dashboard/goals", icon: TargetIcon }, // Show for all use cases
];

const businessNavigation: NavItem[] = [
  { name: "Clients", href: "/dashboard/clients", icon: UsersIcon, useCases: ["freelancer", "small_business", "agency"] },
  { name: "Invoices", href: "/dashboard/invoices", icon: FileTextIcon, useCases: ["freelancer", "small_business", "agency"] },
  { name: "Reports", href: "/dashboard/reports", icon: ChartLineIcon },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="h-16 justify-center items-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:px-0"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <CurrencyCircleDollarIcon
                  className="size-[18px]"
                  weight="bold"
                />
              </div>
              <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-semibold tracking-tight">
                  CoinKeep
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Finance CRM
                </span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation
                .filter(item => !item.useCases || !user?.useCase || item.useCases.includes(user.useCase as UseCase))
                .map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton isActive={isActive} tooltip={item.name}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center"
                        >
                          <item.icon
                            className="size-[18px] shrink-0"
                            weight={isActive ? "fill" : "regular"}
                          />
                          <span className="group-data-[collapsible=icon]:hidden">
                            {item.name}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Business section - only show if there are items to display */}
        {businessNavigation.filter(item => !item.useCases || !user?.useCase || item.useCases.includes(user.useCase as UseCase)).length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
              Business
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {businessNavigation
                  .filter(item => !item.useCases || !user?.useCase || item.useCases.includes(user.useCase as UseCase))
                  .map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton isActive={isActive} tooltip={item.name}>
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center"
                          >
                            <item.icon
                              className="size-[18px] shrink-0"
                              weight={isActive ? "fill" : "regular"}
                            />
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.name}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Link href="/dashboard/settings" className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center">
                <GearIcon className="size-[18px] shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Settings
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-3 w-full p-2 mt-1 rounded-sm hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:size-8"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-medium shrink-0">
                  {userInitials}
                </div>
                <div className="flex flex-1 flex-col text-left leading-none group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium">{user?.name || "User"}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[140px]">
                    {user?.email || "user@example.com"}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                  className="cursor-pointer"
                >
                  <GearIcon className="size-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                  <SignOutIcon className="size-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
