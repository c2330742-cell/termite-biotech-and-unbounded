import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../lib/auth';
import { formatDate, formatRelativeTime, getStatusColor } from '../lib/utils';
import { useWebSocket } from '../contexts/websocket-context';
import { useAuth } from '../contexts/auth-context';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  CalendarClock,
} from 'lucide-react';

interface DashboardData {
  total_pending: number;
  sent_today: number;
  failed_today: number;
  next_scheduled: {
    id: string;
    platform: string;
    recipient: string;
    body: string;
    send_at: string;
    status: string;
  } | null;
  recent: Array<{
    id: string;
    platform: string;
    recipient: string;
    body: string;
    send_at: string;
    status: string;
    created_at: string;
  }>;
  stats: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    cancelled: number;
    by_platform: Record<string, number>;
  };
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { on } = useWebSocket();
  const { isAdmin } = useAuth();

  const fetchData = async () => {
    const result = await apiFetch<DashboardData>('/api/v1/messages/stats');
    if (result.success && result.data) {
      setData(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const unsub = on('*', () => {
      fetchData();
    });
    return unsub;
  }, [on]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const platformIcons: Record<string, string> = {
    telegram: '✈',
    email: '✉',
    sms: '📱',
    whatsapp: '💬',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button onClick={() => navigate('/compose')}>
          <Plus className="mr-2 h-4 w-4" /> New Message
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{data?.total_pending ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sent Today</p>
              <p className="text-2xl font-bold">{data?.sent_today ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed Today</p>
              <p className="text-2xl font-bold">{data?.failed_today ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
              <CalendarClock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next</p>
              <p className="text-lg font-bold truncate">
                {data?.next_scheduled
                  ? formatRelativeTime(data.next_scheduled.send_at)
                  : 'None'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Platform</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && Object.entries(stats.by_platform).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.by_platform).map(([platform, count]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{platformIcons[platform] || '📨'}</span>
                      <span className="text-sm capitalize">{platform}</span>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No messages yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recent && data.recent.length > 0 ? (
              <div className="space-y-3">
                {data.recent.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent"
                    onClick={() => navigate(`/queue`)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {platformIcons[msg.platform]} {msg.recipient}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{msg.body}</p>
                    </div>
                    <Badge variant={msg.status as 'pending' | 'sent' | 'failed' | 'cancelled'}>
                      {msg.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Send className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">No messages yet</p>
                <Button variant="outline" onClick={() => navigate('/compose')}>
                  Create your first message
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats summary */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Time Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="text-xl font-bold text-green-600">{stats.sent}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Failed</p>
                <p className="text-xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cancelled</p>
                <p className="text-xl font-bold">{stats.cancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
