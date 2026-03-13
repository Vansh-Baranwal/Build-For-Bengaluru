"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, MapPin, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplaintData {
  id: string;
  category: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in-progress" | "resolved";
  location: string;
  createdAt: string;
  description: string;
}

const mockComplaints: Record<string, ComplaintData> = {
  "NF12345678": {
    id: "NF12345678",
    category: "Pothole",
    priority: "high",
    status: "in-progress",
    location: "Whitefield Main Road, Bengaluru",
    createdAt: "2024-01-15T10:30:00Z",
    description: "Large pothole causing traffic disruption near Whitefield metro station",
  },
  "NF87654321": {
    id: "NF87654321",
    category: "Garbage",
    priority: "medium",
    status: "pending",
    location: "Koramangala 4th Block",
    createdAt: "2024-01-14T14:45:00Z",
    description: "Garbage not collected for 3 days",
  },
  "NF11223344": {
    id: "NF11223344",
    category: "Streetlight",
    priority: "low",
    status: "resolved",
    location: "Indiranagar 100ft Road",
    createdAt: "2024-01-10T08:00:00Z",
    description: "Streetlight not working for past week",
  },
};

const statusSteps = [
  { key: "pending", label: "Pending", icon: Clock },
  { key: "in-progress", label: "In Progress", icon: AlertTriangle },
  { key: "resolved", label: "Resolved", icon: CheckCircle2 },
];

export default function TrackPage() {
  const [complaintId, setComplaintId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [complaint, setComplaint] = useState<ComplaintData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!complaintId.trim()) return;

    setIsSearching(true);
    setNotFound(false);
    setComplaint(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const found = mockComplaints[complaintId.toUpperCase()];
    if (found) {
      setComplaint(found);
    } else {
      setNotFound(true);
    }
    setIsSearching(false);
  };

  const getStatusIndex = (status: string) => {
    return statusSteps.findIndex((s) => s.key === status);
  };

  const priorityStyles = {
    high: "bg-destructive text-destructive-foreground",
    medium: "bg-warning text-warning-foreground",
    low: "bg-secondary text-secondary-foreground",
  };

  const statusStyles = {
    pending: "bg-muted text-muted-foreground",
    "in-progress": "bg-primary text-primary-foreground",
    resolved: "bg-success text-success-foreground",
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Track Your Complaint</CardTitle>
            <CardDescription>
              Enter your complaint ID to check the current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="complaintId" className="sr-only">Complaint ID</Label>
                <Input
                  id="complaintId"
                  placeholder="Enter Complaint ID (e.g., NF12345678)"
                  value={complaintId}
                  onChange={(e) => setComplaintId(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button type="submit" disabled={isSearching} className="h-11">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Search</span>
              </Button>
            </form>

            {notFound && (
              <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                <p className="text-destructive font-medium">Complaint not found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please check the complaint ID and try again
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complaint Details Card */}
        {complaint && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">Complaint Details</CardTitle>
                  <CardDescription className="font-mono mt-1">{complaint.id}</CardDescription>
                </div>
                <Badge className={statusStyles[complaint.status]}>
                  {complaint.status.replace("-", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium text-foreground">{complaint.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge className={cn("mt-1", priorityStyles[complaint.priority])}>
                    {complaint.priority}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">{complaint.location}</p>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-foreground">
                      {new Date(complaint.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1 text-foreground">{complaint.description}</p>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-4">Progress Timeline</p>
                <div className="relative flex justify-between">
                  {/* Progress Line */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                  <div 
                    className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                    style={{ 
                      width: `${(getStatusIndex(complaint.status) / (statusSteps.length - 1)) * 100}%` 
                    }}
                  />

                  {statusSteps.map((step, index) => {
                    const isCompleted = index <= getStatusIndex(complaint.status);
                    const isCurrent = step.key === complaint.status;
                    
                    return (
                      <div key={step.key} className="relative flex flex-col items-center">
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors z-10",
                            isCompleted
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-card border-border text-muted-foreground",
                            isCurrent && "ring-4 ring-primary/20"
                          )}
                        >
                          <step.icon className="h-5 w-5" />
                        </div>
                        <span
                          className={cn(
                            "mt-2 text-xs font-medium",
                            isCompleted ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample IDs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Demo Complaint IDs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.keys(mockComplaints).map((id) => (
                <Button
                  key={id}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setComplaintId(id);
                  }}
                  className="font-mono text-xs"
                >
                  {id}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
