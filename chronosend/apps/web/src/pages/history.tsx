import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/auth';
import { formatDate, truncate } from '../lib/utils';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../components/ui/dialog';
import { toast } from '../hooks/use-toast';
import { History, RotateCcw, Send, Mail, MessageSquare, Phone } from 'lucide-react';

interface MessageWithLogs {
  id: string;
  platform: string;
  recipient: string;
  subject: string | null;
  body: string;
  send_at: string;
  status: string;
  failure_reason: string | null;
  sent_at: string | null;
  created_at: string;
  delivery_logs: Array<{
    id: string;
    attempt: number;
    status: string;
    failure_reason: string | null;
    attempted_at: string;
  }>;
}

const platformIcons: Record<string, React.ReactNode> = {
  telegram: <Send className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  sms: <Phone className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
};

const statusFilterOptions = [
  { value: 'sent,failed,cancelled', label: 'All History' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function HistoryPage() {
  const [messages, setMessages] = useState<MessageWithLogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('sent,failed,cancelled');
  const [selectedMsg, setSelectedMsg] = useState<MessageWithLogs | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async () => {
    const params = new URLSearchParams({
      page: String(page),
      limit: '20',
      status: statusFilter,
    });
    const result = await apiFetch<{ items: MessageWithLogs[]; totalPages: number }>(
      `/api/v1/messages?${params}`,
    );
    if (result.success && result.data) {
      setMessages(result.data.items);
      setTotalPages(result.data.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter]);

  const handleRetry = async (msg: MessageWithLogs) => {
    const result = await apiFetch('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify({
        platform: msg.platform,
        recipient: msg.recipient,
        subject: msg.subject,
        body: msg.body,
        send_at: new Date(Date.now() + 60000).toISOString(),
        repeat_rule: 'none',
      }),
    });
    if (result.success) {
      toast('New message scheduled as retry', { variant: 'success' });
      setSelectedMsg(null);
      fetchHistory();
    } else {
      toast(result.error || 'Retry failed', { variant: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">History</h1>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          options={statusFilterOptions}
          className="w-40"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No history yet</p>
            <p className="text-sm text-muted-foreground">Sent, failed, and cancelled messages will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setSelectedMsg(msg)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-muted-foreground">{platformIcons[msg.platform]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{msg.recipient}</p>
                  <p className="text-xs text-muted-foreground truncate">{truncate(msg.body, 50)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-xs text-muted-foreground">{formatDate(msg.send_at)}</span>
                <Badge variant={msg.status as 'sent' | 'failed' | 'cancelled'}>
                  {msg.status}
                </Badge>
                {msg.status === 'failed' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRetry(msg); }}
                    className="p-1 hover:bg-accent rounded"
                    title="Retry"
                  >
                    <RotateCcw className="h-4 w-4 text-primary" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedMsg} onOpenChange={() => setSelectedMsg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMsg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Platform</p>
                  <p className="font-medium capitalize">{selectedMsg.platform}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedMsg.status as 'sent' | 'failed' | 'cancelled'}>{selectedMsg.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Recipient</p>
                  <p className="font-medium">{selectedMsg.recipient}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Scheduled</p>
                  <p className="font-medium">{formatDate(selectedMsg.send_at)}</p>
                </div>
                {selectedMsg.sent_at && (
                  <div>
                    <p className="text-muted-foreground">Sent at</p>
                    <p className="font-medium">{formatDate(selectedMsg.sent_at)}</p>
                  </div>
                )}
              </div>
              {selectedMsg.failure_reason && (
                <div>
                  <p className="text-sm text-muted-foreground">Failure reason</p>
                  <p className="text-sm text-destructive">{selectedMsg.failure_reason}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Body</p>
                <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{selectedMsg.body}</div>
              </div>
              {selectedMsg.delivery_logs && selectedMsg.delivery_logs.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Delivery attempts</p>
                  <div className="space-y-1">
                    {selectedMsg.delivery_logs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between rounded border p-2 text-xs">
                        <span>Attempt #{log.attempt}</span>
                        <Badge variant={log.status as 'sent' | 'failed'}>{log.status}</Badge>
                        <span className="text-muted-foreground">{formatDate(log.attempted_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedMsg.status === 'failed' && (
                <Button onClick={() => handleRetry(selectedMsg)} className="w-full">
                  <RotateCcw className="mr-2 h-4 w-4" /> Retry Message
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
