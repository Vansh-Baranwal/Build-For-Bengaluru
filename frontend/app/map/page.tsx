"use client";

import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Dynamic import for Leaflet (SSR-incompatible)
const CityMap = dynamic(
  () => import("@/components/dashboard/city-map").then((mod) => mod.CityMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[500px] bg-muted rounded-lg">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    ),
  }
);

export default function MapPage() {
  return (
    <DashboardLayout>
      <Card className="h-[calc(100vh-8rem)]">
        <CardHeader>
          <CardTitle>City Issues Map</CardTitle>
          <CardDescription>
            Real-time visualization of civic issues across Bengaluru. Click on markers for details.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)]">
          <CityMap />
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
