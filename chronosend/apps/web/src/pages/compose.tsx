import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { apiFetch } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from '../hooks/use-toast';
import { Send, Mail, MessageSquare, Phone, Plane, Settings as SettingsIcon, Headphones } from 'lucide-react';

const platforms = [
  { value: 'telegram', label: 'Telegram', icon: Plane },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'sms', label: 'SMS', icon: Phone },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'discord', label: 'Discord', icon: Headphones },
];

const repeatOptions = [
  { value: 'none', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function ComposePage() {
  const [platform, setPlatform] = useState('email');
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendAt, setSendAt] = useState('');
  const [repeatRule, setRepeatRule] = useState('none');
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!recipient) e.recipient = 'Recipient is required';
    if (!body) e.body = 'Message body is required';
    if (!sendAt) e.sendAt = 'Send date/time is required';
    if (platform === 'email' && !subject) e.subject = 'Subject is required for email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSending(true);
    const result = await apiFetch('/api/v1/messages', {
      method: 'POST',
      body: JSON.stringify({
        platform,
        recipient,
        subject: platform === 'email' ? subject : undefined,
        body,
        send_at: new Date(sendAt).toISOString(),
        repeat_rule: repeatRule,
      }),
    });

    if (result.success) {
      toast('Message scheduled!', { variant: 'success' });
      navigate('/queue');
    } else {
      toast(result.error || 'Failed to create message', { variant: 'error' });
    }
    setSending(false);
  };

  const { hasCredentials } = useAuth();

  const PlatformIcon = platforms.find((p) => p.value === platform)?.icon || Send;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Compose Message</h1>
      </div>

      {hasCredentials === false && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 flex items-start gap-3">
          <SettingsIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium">No delivery methods configured</p>
            <p className="mt-1">Set up at least one delivery method (Email, Telegram, etc.) before sending messages.</p>
            <Link to="/settings" className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              <SettingsIcon className="h-4 w-4" /> Go to Settings
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Platform picker */}
        <div>
          <label className="text-sm font-medium mb-2 block">Platform</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {platforms.map((p) => {
              const Icon = p.icon;
              const isActive = platform === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPlatform(p.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-transparent bg-card hover:bg-accent'
                  }`}
                >
                  <Icon className={`h-6 w-6 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-xs font-medium ${isActive ? 'text-primary' : ''}`}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PlatformIcon className="h-5 w-5 text-primary" />
              Message Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Recipient"
              placeholder={
                platform === 'telegram'
                  ? '@username or chat ID'
                  : platform === 'email'
                  ? 'recipient@example.com'
                  : platform === 'sms'
                  ? '+1234567890 (E.164 format)'
                  : platform === 'discord'
                  ? 'channel ID or webhook URL'
                  : '+1234567890'
              }
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              error={errors.recipient}
            />

            {platform === 'email' && (
              <Input
                label="Subject"
                placeholder="Email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                error={errors.subject}
              />
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Message</label>
              <div className="relative">
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Type your message here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={10000}
                />
                <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  {body.length}/10000
                </span>
              </div>
              {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Send Date & Time"
                type="datetime-local"
                value={sendAt}
                onChange={(e) => setSendAt(e.target.value)}
                error={errors.sendAt}
              />
              <Select
                label="Repeat"
                value={repeatRule}
                onChange={(e) => setRepeatRule(e.target.value)}
                options={repeatOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {body && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  To: {recipient || '...'} | Via: {platform}
                </p>
                {subject && <p className="text-sm font-medium">Subject: {subject}</p>}
                <p className="text-sm whitespace-pre-wrap">{body}</p>
                {sendAt && (
                  <p className="text-xs text-muted-foreground pt-2 border-t">
                    Scheduled: {new Date(sendAt).toLocaleString()} | Repeats: {repeatRule}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" loading={sending}>
            <Send className="mr-2 h-4 w-4" /> Schedule Message
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
