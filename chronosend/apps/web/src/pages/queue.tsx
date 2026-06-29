import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/auth';
import { formatDate, getStatusColor, truncate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from '../components/ui/dialog';
import { toast } from '../hooks/use-toast';
import { Search, XCircle, Clock, Send, Mail, MessageSquare, Phone } from 'lucide-react';

interface Message {
  id: string;
  platform: string;
  recipient: string;
  subject: string | null;
  body: string;
  send_at: string;
  repeat_rule: string;
  status: string;
  created_at: string;
}

const platformIcons: Record<string, React.ReactNode> = {
  telegram: <Send className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  sms: <Phone className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
};

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const platformFilterOptions = [
  { value: '', label: 'All Platforms' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export function QueuePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);

  const limit = 15;

  const fetchMessages = async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    if (platformFilter) params.set('platform', platformFilter);

    const result = await apiFetch<{ items: Message[]; total: number; totalPages: number }>(
      `/api/v1/messages?${params}`,
    );
    if (result.success && result.data) {
      setMessages(result.data.items);
      setTotal(result.data.total);
      setTotalPages(result.data.totalPages);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [page, status, platformFilter]);

  const handleCancel = async (id: string) => {
    const result = await apiFetch(`/api/v1/messages/${id}`, { method: 'DELETE' });
    if (result.success) {
      toast('Message cancelled', { variant: 'success' });
      fetchMessages();
    } else {
      toast(result.error || 'Failed to cancel', { variant: 'error' });
    }
    setCancelId(null);
  };

  const filteredMessages = search
    ? messages.filter((m) =>
        m.recipient.toLowerCase().includes(search.toLowerCase()) ||
        m.body.toLowerCase().includes(search.toLowerCase()),
      )
    : messages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Queue</h1>
        <p className="text-sm text-muted-foreground">{total} total</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Search recipient or body..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          options={statusOptions}
          className="w-40"
        />
        <Select
          value={platformFilter}
          onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
          options={platformFilterOptions}
          className="w-40"
        />
      </div>

      {/* Messages list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filteredMessages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No messages found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setSelectedMsg(msg)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-muted-foreground">{platformIcons[msg.platform]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{msg.recipient}</p>
                  <p className="text-xs text-muted-foreground truncate">{truncate(msg.body, 60)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(msg.send_at)}
                </span>
                <Badge variant={msg.status as 'pending' | 'sent' | 'failed' | 'cancelled'}>
                  {msg.status}
                </Badge>
                {msg.status === 'pending' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCancelId(msg.id); }}
                    className="p-1 hover:bg-destructive/10 rounded"
                    title="Cancel"
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancelId} onOpenChange={() => setCancelId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this scheduled message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => cancelId && handleCancel(cancelId)}
            >
              Cancel Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message detail dialog */}
      <Dialog open={!!selectedMsg} onOpenChange={() => setSelectedMsg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
          </DialogHeader>
          {selectedMsg && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Platform</p>
                  <p className="font-medium capitalize">{selectedMsg.platform}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedMsg.status as 'pending' | 'sent' | 'failed' | 'cancelled'}>
                    {selectedMsg.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Recipient</p>
                  <p className="font-medium">{selectedMsg.recipient}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Repeat</p>
                  <p className="font-medium capitalize">{selectedMsg.repeat_rule}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Scheduled</p>
                  <p className="font-medium">{formatDate(selectedMsg.send_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(selectedMsg.created_at)}</p>
                </div>
              </div>
              {selectedMsg.subject && (
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="text-sm font-medium">{selectedMsg.subject}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Body</p>
                <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                  {selectedMsg.body}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
