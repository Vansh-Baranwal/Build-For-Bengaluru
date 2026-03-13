"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AlertBannerProps {
  message: string;
  type?: "warning" | "danger" | "info";
}

export function AlertBanner({ message, type = "warning" }: AlertBannerProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const styles = {
    warning: "bg-warning/10 border-warning/30 text-warning-foreground",
    danger: "bg-destructive/10 border-destructive/30 text-destructive",
    info: "bg-info/10 border-info/30 text-info",
  };

  const iconStyles = {
    warning: "text-warning",
    danger: "text-destructive",
    info: "text-info",
  };

  return (
    <div className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-3 ${styles[type]}`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className={`h-5 w-5 flex-shrink-0 ${iconStyles[type]}`} />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-transparent"
        onClick={() => setVisible(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
