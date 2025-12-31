"use client";

import { ReactNode } from "react";
import { MagnifyingGlassIcon, BellIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function Header({ title, subtitle, action, children }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between bg-background px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex flex-col leading-none">
          <h1 className="text-base font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Action Button (legacy prop) */}
        {action && (
          <Button onClick={action.onClick} size="sm" className="h-8 text-xs">
            <PlusIcon className="size-3.5" />
            {action.label}
          </Button>
        )}

        {/* Custom children (e.g., buttons) */}
        {children}
      </div>
    </header>
  );
}
