import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Share2, XCircle } from "lucide-react";
import { formatTimeAgo } from "@/lib/file-utils";
import { cn } from "@/lib/utils";

interface ActivityLog {
  id: number;
  action: string;
  fileId: number;
  fileName: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details?: string;
}

interface ActivityLogsProps {
  logs: ActivityLog[];
  isLoading?: boolean;
  showViewAll?: boolean;
}

export default function ActivityLogs({ logs, isLoading = false, showViewAll = true }: ActivityLogsProps) {
  if (isLoading) {
    return <ActivityLogsSkeleton />;
  }

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'download':
        return <Download className="h-4 w-4 text-primary-600" />;
      case 'share':
        return <Share2 className="h-4 w-4 text-secondary-600" />;
      case 'expire':
        return <XCircle className="h-4 w-4 text-danger" />;
      default:
        return <Share2 className="h-4 w-4 text-dark-500" />;
    }
  };

  const getActivityBg = (action: string) => {
    switch (action) {
      case 'download':
        return 'bg-primary-100';
      case 'share':
        return 'bg-secondary-100';
      case 'expire':
        return 'bg-danger-100';
      default:
        return 'bg-dark-100';
    }
  };

  const getActivityText = (log: ActivityLog) => {
    switch (log.action) {
      case 'download':
        return `File "${log.fileName}" was downloaded`;
      case 'share':
        return `Link created for "${log.fileName}"`;
      case 'expire':
        return `Link expired for "${log.fileName}"`;
      case 'access':
        return `File "${log.fileName}" was accessed`;
      default:
        return `Activity related to "${log.fileName}"`;
    }
  };

  const getActivityDetails = (log: ActivityLog) => {
    switch (log.action) {
      case 'download':
        return `From IP ${log.ipAddress} • ${log.userAgent}`;
      case 'share':
        return log.details || 'Shared with link';
      case 'expire':
        return 'Automatically expired';
      case 'access':
        return `From IP ${log.ipAddress} • ${log.userAgent}`;
      default:
        return '';
    }
  };

  return (
    <Card className="mt-8 bg-white rounded-lg shadow">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-dark-200 flex justify-between items-center">
        <div>
          <CardTitle className="text-lg leading-6 font-medium text-dark-900">Recent Activity</CardTitle>
          <CardDescription className="mt-1 max-w-2xl text-sm text-dark-500">Access logs for your encrypted files</CardDescription>
        </div>
        {showViewAll && logs.length > 0 && (
          <a href="/activity" className="text-sm text-primary-600 hover:text-primary-900">View all</a>
        )}
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {logs.length === 0 ? (
          <div className="text-center py-6 text-dark-500">
            No activity has been recorded yet
          </div>
        ) : (
          <ul className="space-y-4">
            {logs.map((log) => (
              <li key={log.id} className="py-3">
                <div className="flex items-center space-x-4">
                  <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", getActivityBg(log.action))}>
                    {getActivityIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-900 truncate">
                      {getActivityText(log)}
                    </p>
                    <p className="text-sm text-dark-500">
                      {getActivityDetails(log)}
                    </p>
                  </div>
                  <div className="inline-flex items-center text-sm text-dark-500">
                    {formatTimeAgo(log.timestamp)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityLogsSkeleton() {
  return (
    <Card className="mt-8 bg-white rounded-lg shadow">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-dark-200 flex justify-between items-center">
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <Skeleton className="h-4 w-16" />
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <ul className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <li key={index} className="py-3">
              <div className="flex items-center space-x-4">
                <Skeleton className="flex-shrink-0 w-8 h-8 rounded-full" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
