"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  Droplets,
  Trash2,
  Lightbulb,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendingIssue {
  id: string;
  type: "pothole" | "garbage" | "flooding" | "drainage" | "streetlight";
  complaints: number;
  location: string;
  trend: "up" | "stable" | "down";
  changePercent: number;
}

const trendingIssues: TrendingIssue[] = [
  { id: "1", type: "flooding", complaints: 47, location: "Silk Board Junction", trend: "up", changePercent: 35 },
  { id: "2", type: "pothole", complaints: 38, location: "Whitefield Main Road", trend: "up", changePercent: 28 },
  { id: "3", type: "garbage", complaints: 32, location: "Marathahalli Bridge", trend: "up", changePercent: 15 },
  { id: "4", type: "drainage", complaints: 28, location: "KR Market Area", trend: "stable", changePercent: 2 },
  { id: "5", type: "pothole", complaints: 24, location: "Electronic City Phase 1", trend: "up", changePercent: 12 },
  { id: "6", type: "garbage", complaints: 21, location: "Koramangala 4th Block", trend: "down", changePercent: -8 },
  { id: "7", type: "flooding", complaints: 19, location: "Hebbal Lake Area", trend: "up", changePercent: 22 },
  { id: "8", type: "streetlight", complaints: 15, location: "Indiranagar 100ft Road", trend: "stable", changePercent: 0 },
  { id: "9", type: "drainage", complaints: 14, location: "Majestic Bus Stand", trend: "down", changePercent: -5 },
  { id: "10", type: "streetlight", complaints: 11, location: "JP Nagar 6th Phase", trend: "stable", changePercent: 1 },
  { id: "11", type: "pothole", complaints: 9, location: "Jayanagar 4th Block", trend: "down", changePercent: -12 },
  { id: "12", type: "garbage", complaints: 8, location: "BTM Layout 2nd Stage", trend: "up", changePercent: 8 },
];

const issueIcons: Record<string, React.ElementType> = {
  pothole: CircleDot,
  garbage: Trash2,
  flooding: Droplets,
  drainage: AlertTriangle,
  streetlight: Lightbulb,
};

const issueColors: Record<string, string> = {
  pothole: "text-destructive bg-destructive/10",
  garbage: "text-warning bg-warning/10",
  flooding: "text-info bg-info/10",
  drainage: "text-chart-4 bg-chart-4/10",
  streetlight: "text-chart-5 bg-chart-5/10",
};

export default function TrendingPage() {
  // Sort by complaint count
  const sortedIssues = [...trendingIssues].sort((a, b) => b.complaints - a.complaints);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Trending Civic Issues
            </CardTitle>
            <CardDescription>
              Current issue clusters sorted by complaint volume. Data updated in real-time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedIssues.map((issue, index) => {
                const Icon = issueIcons[issue.type];
                const colorClass = issueColors[issue.type];
                
                return (
                  <div
                    key={issue.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
                  >
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-sm">
                      {index + 1}
                    </div>

                    {/* Issue Icon */}
                    <div className={cn("flex-shrink-0 p-2.5 rounded-lg", colorClass)}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Issue Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground capitalize">
                          {issue.type}
                        </h3>
                        <Badge variant="outline" className="capitalize">
                          {issue.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{issue.location}</span>
                      </div>
                    </div>

                    {/* Complaint Count */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-2xl font-bold text-foreground">{issue.complaints}</p>
                      <p className="text-xs text-muted-foreground">complaints</p>
                    </div>

                    {/* Trend Indicator */}
                    <div className="flex-shrink-0 w-20 text-right">
                      <div
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          issue.trend === "up" && "bg-destructive/10 text-destructive",
                          issue.trend === "down" && "bg-success/10 text-success",
                          issue.trend === "stable" && "bg-muted text-muted-foreground"
                        )}
                      >
                        {issue.trend === "up" && (
                          <>
                            <TrendingUp className="h-3 w-3" />
                            +{issue.changePercent}%
                          </>
                        )}
                        {issue.trend === "down" && (
                          <>
                            <TrendingUp className="h-3 w-3 rotate-180" />
                            {issue.changePercent}%
                          </>
                        )}
                        {issue.trend === "stable" && "Stable"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {sortedIssues.reduce((sum, i) => sum + i.complaints, 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total Clustered Complaints</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {sortedIssues.filter((i) => i.trend === "up").length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Rising Clusters</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">
                  {sortedIssues.filter((i) => i.complaints >= 30).length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Critical Hotspots</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
