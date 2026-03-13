"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { StatCard } from "@/components/dashboard/stat-card";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { HotspotCard } from "@/components/dashboard/hotspot-card";
import {
  FileText,
  AlertTriangle,
  Droplets,
  Trash2,
} from "lucide-react";

const stats = [
  { title: "Total Complaints", value: 2847, icon: FileText, variant: "default" as const, trend: "+12% from last week" },
  { title: "High Priority Issues", value: 156, icon: AlertTriangle, variant: "danger" as const, trend: "23 urgent pending" },
  { title: "Flooding Alerts", value: 42, icon: Droplets, variant: "info" as const, trend: "Active monsoon monitoring" },
  { title: "Garbage Reports", value: 384, icon: Trash2, variant: "warning" as const, trend: "18 pending collection" },
];

const hotspots = [
  { issueType: "pothole", complaints: 12, location: "Whitefield area", severity: "high" as const },
  { issueType: "garbage", complaints: 8, location: "Koramangala 4th Block", severity: "medium" as const },
  { issueType: "flooding", complaints: 15, location: "Silk Board Junction", severity: "high" as const },
  { issueType: "streetlight", complaints: 6, location: "Indiranagar 100ft Road", severity: "low" as const },
  { issueType: "drainage", complaints: 9, location: "Majestic Bus Stand", severity: "medium" as const },
  { issueType: "pothole", complaints: 7, location: "Electronic City Phase 1", severity: "medium" as const },
];

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Alert Banner */}
        <AlertBanner 
          message="High number of pothole complaints detected near Whitefield area. Immediate attention required."
          type="warning"
        />

        {/* Statistics */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatCard
                key={stat.title}
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                variant={stat.variant}
                trend={stat.trend}
              />
            ))}
          </div>
        </section>

        {/* City Issue Hotspots */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">City Issue Hotspots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotspots.map((hotspot, index) => (
              <HotspotCard
                key={index}
                issueType={hotspot.issueType}
                complaints={hotspot.complaints}
                location={hotspot.location}
                severity={hotspot.severity}
              />
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
