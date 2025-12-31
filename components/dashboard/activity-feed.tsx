"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "transaction" | "invoice" | "client" | "account";
  title: string;
  description: string;
  timestamp: number;
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  isLoading: boolean;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ActivityFeed({ activities = [], isLoading }: ActivityFeedProps) {
  const mockActivities: ActivityItem[] = [
    {
      id: "1",
      type: "transaction",
      title: "Payment received",
      description: "From Acme Corp",
      timestamp: Date.now() - 1800000,
    },
    {
      id: "2",
      type: "invoice",
      title: "Invoice sent",
      description: "INV-2024-001",
      timestamp: Date.now() - 7200000,
    },
    {
      id: "3",
      type: "client",
      title: "New client added",
      description: "John Smith",
      timestamp: Date.now() - 86400000,
    },
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Recent updates</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
          
          <div className="space-y-6">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="relative flex gap-4 pl-8">
                  <div className="absolute left-1.5 size-3 rounded-full border-2 border-background bg-muted" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))
            ) : (
              displayActivities.map((activity, index) => (
                <div key={activity.id} className="relative flex gap-4 pl-8">
                  <div className={cn(
                    "absolute left-1.5 size-3 rounded-full border-2 border-background",
                    index === 0 ? "bg-foreground" : "bg-muted"
                  )} />
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description} · {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
