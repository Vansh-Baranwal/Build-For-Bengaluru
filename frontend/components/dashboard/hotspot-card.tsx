"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface HotspotCardProps {
  issueType: string;
  complaints: number;
  location: string;
  severity: "high" | "medium" | "low";
}

export function HotspotCard({ issueType, complaints, location, severity }: HotspotCardProps) {
  const severityStyles = {
    high: "bg-destructive/10 border-destructive/30",
    medium: "bg-warning/10 border-warning/30",
    low: "bg-muted border-border",
  };

  const badgeStyles = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-warning text-warning-foreground",
    low: "bg-secondary text-secondary-foreground",
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", severityStyles[severity])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-card-foreground capitalize">{issueType} cluster detected</h3>
          <Badge className={badgeStyles[severity]}>
            {severity}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-card-foreground">{complaints}</span> complaints reported
        </p>
      </CardContent>
    </Card>
  );
}
