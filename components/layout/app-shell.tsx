"use client";

import { ReactNode } from "react";
import { AppSidebar } from "./sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="h-screen w-screen p-3 bg-sidebar">
      <div className="h-full w-full flex overflow-hidden shadow-none bg-background">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="h-full overflow-hidden">
            <div className="flex h-full flex-col overflow-hidden">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </div>
  );
}
