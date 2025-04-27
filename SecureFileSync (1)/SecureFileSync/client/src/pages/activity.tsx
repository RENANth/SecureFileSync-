import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityLogs from "@/components/files/activity-logs";

export default function ActivityPage() {
  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/logs'],
  });

  const downloadLogs = logs.filter(log => log.action === 'download');
  const shareLogs = logs.filter(log => log.action === 'share');
  const accessLogs = logs.filter(log => log.action === 'access');

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark-900">Activity Logs</h1>
        <p className="mt-1 text-sm text-dark-500">Track all activity related to your encrypted files</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>All file-related activity is securely logged</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Activity</TabsTrigger>
              <TabsTrigger value="downloads">Downloads</TabsTrigger>
              <TabsTrigger value="shares">Shares</TabsTrigger>
              <TabsTrigger value="access">Access</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <ActivityLogs logs={logs} isLoading={isLoading} />
            </TabsContent>
            
            <TabsContent value="downloads">
              <ActivityLogs logs={downloadLogs} isLoading={isLoading} />
            </TabsContent>
            
            <TabsContent value="shares">
              <ActivityLogs logs={shareLogs} isLoading={isLoading} />
            </TabsContent>
            
            <TabsContent value="access">
              <ActivityLogs logs={accessLogs} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
