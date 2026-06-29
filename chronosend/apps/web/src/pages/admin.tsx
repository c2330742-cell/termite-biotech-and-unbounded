import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/auth';
import { formatDate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '../components/ui/dialog';
import { toast } from '../hooks/use-toast';
import { Users, MessageSquare, Activity, Trash2, Shield } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  total_messages: number;
  pending_messages: number;
  sent_messages: number;
  failed_messages: number;
}

interface AdminMessage {
  id: string;
  user_email: string;
  platform: string;
  recipient: string;
  body: string;
  status: string;
  send_at: string;
  created_at: string;
}

interface AdminHealth {
  status: string;
  uptime: number;
  database: string;
  scheduler_queue_depth: number;
  websocket_clients: number;
  memory_usage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  total_users: number;
  total_messages: number;
}

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [health, setHealth] = useState<AdminHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [usersRes, msgsRes, healthRes] = await Promise.all([
      apiFetch<AdminUser[]>('/api/v1/admin/users'),
      apiFetch<{ items: AdminMessage[] }>('/api/v1/admin/messages?limit=50'),
      apiFetch<AdminHealth>('/api/v1/admin/health'),
    ]);

    if (usersRes.success && usersRes.data) setUsers(usersRes.data);
    if (msgsRes.success && msgsRes.data) setMessages(msgsRes.data.items);
    if (healthRes.success && healthRes.data) setHealth(healthRes.data);
    setLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    const result = await apiFetch(`/api/v1/admin/users/${deleteTarget.id}`, { method: 'DELETE' });
    if (result.success) {
      toast(`User ${deleteTarget.email} deleted`, { variant: 'success' });
      setDeleteTarget(null);
      loadAll();
    } else {
      toast(result.error || 'Delete failed', { variant: 'error' });
    }
  };

  if (loading) {
    return <div className="space-y-4">{Array(3).fill(0).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  const mem = health?.memory_usage;
  const uptimeStr = health ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '--';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Admin Panel</h1>
      </div>

      {/* Health cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className={`h-2 w-2 rounded-full ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">{health?.status}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Uptime</p>
            <p className="text-lg font-bold mt-1">{uptimeStr}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Queue Depth</p>
            <p className="text-lg font-bold mt-1">{health?.scheduler_queue_depth ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">WebSocket Clients</p>
            <p className="text-lg font-bold mt-1">{health?.websocket_clients ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Memory */}
      {mem && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Memory Usage</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-muted-foreground">Heap Used</p><p className="text-xl font-bold">{mem.heapUsed} MB</p></div>
              <div><p className="text-xs text-muted-foreground">Heap Total</p><p className="text-xl font-bold">{mem.heapTotal} MB</p></div>
              <div><p className="text-xs text-muted-foreground">RSS</p><p className="text-xl font-bold">{mem.rss} MB</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Users ({users.length})</TabsTrigger>
          <TabsTrigger value="messages" className="gap-2"><MessageSquare className="h-4 w-4" /> Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-center p-3 font-medium">Total</th>
                      <th className="text-center p-3 font-medium">Pending</th>
                      <th className="text-center p-3 font-medium">Sent</th>
                      <th className="text-center p-3 font-medium">Failed</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b hover:bg-accent/50">
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                        </td>
                        <td className="p-3 text-center">{u.total_messages}</td>
                        <td className="p-3 text-center text-blue-600">{u.pending_messages}</td>
                        <td className="p-3 text-center text-green-600">{u.sent_messages}</td>
                        <td className="p-3 text-center text-red-600">{u.failed_messages}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1 hover:bg-destructive/10 rounded text-destructive"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Platform</th>
                      <th className="text-left p-3 font-medium">Recipient</th>
                      <th className="text-left p-3 font-medium">Body</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-accent/50">
                        <td className="p-3 max-w-[120px] truncate">{m.user_email}</td>
                        <td className="p-3 capitalize">{m.platform}</td>
                        <td className="p-3 max-w-[120px] truncate">{m.recipient}</td>
                        <td className="p-3 max-w-[200px] truncate">{m.body}</td>
                        <td className="p-3 text-center">
                          <Badge variant={m.status as 'pending' | 'sent' | 'failed' | 'cancelled'}>{m.status}</Badge>
                        </td>
                        <td className="p-3 text-right text-xs text-muted-foreground">{formatDate(m.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Permanently delete {deleteTarget?.email} and all their messages? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDeleteUser}>Delete Forever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
