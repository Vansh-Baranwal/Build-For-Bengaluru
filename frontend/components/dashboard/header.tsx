"use client";

import { Activity } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-4 md:ml-0 ml-12">
        <h1 className="text-lg md:text-xl font-semibold text-card-foreground">
          <span className="hidden sm:inline">NammaFix — </span>
          <span className="text-muted-foreground font-normal">Civic Intelligence Platform</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
        <Activity className="h-4 w-4 text-success animate-pulse" />
        <span className="text-xs font-medium text-success hidden sm:inline">City Monitoring Active</span>
        <span className="text-xs font-medium text-success sm:hidden">Active</span>
      </div>
    </header>
  );
}
