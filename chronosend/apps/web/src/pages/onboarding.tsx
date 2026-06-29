import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { apiFetch } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from '../hooks/use-toast';
import { Mail, Send, Phone, MessageSquare, Check, ArrowRight, Clock, Headphones } from 'lucide-react';

const platforms = [
  { value: 'email', label: 'Email', icon: Mail, desc: 'Send via SMTP (Gmail, Outlook, etc.)' },
  { value: 'telegram', label: 'Telegram', icon: Send, desc: 'Send via Telegram Bot' },
  { value: 'sms', label: 'SMS', icon: Phone, desc: 'Send via Twilio SMS' },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, desc: 'Send via Twilio WhatsApp' },
  { value: 'discord', label: 'Discord', icon: Headphones, desc: 'Send via Discord Bot' },
];

export function OnboardingPage() {
  const [step, setStep] = useState<'intro' | 'setup' | 'done'>('intro');
  const [platform, setPlatform] = useState('email');
  const [emailAddress, setEmailAddress] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');
  const [discordToken, setDiscordToken] = useState('');
  const [saving, setSaving] = useState(false);
  const { checkCredentials } = useAuth();
  const navigate = useNavigate();

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    if (platform === 'email') {
      if (!emailAddress || !emailPassword) {
        toast('Please fill in both email and app password', { variant: 'error' });
        setSaving(false);
        return;
      }
      payload.email_address = emailAddress;
      payload.email_app_password = emailPassword;
    } else if (platform === 'telegram') {
      if (!telegramToken) {
        toast('Please enter your Telegram bot token', { variant: 'error' });
        setSaving(false);
        return;
      }
      payload.telegram_bot_token = telegramToken;
    } else if (platform === 'sms') {
      if (!twilioSid || !twilioToken || !twilioPhone) {
        toast('Please fill in all Twilio fields', { variant: 'error' });
        setSaving(false);
        return;
      }
      payload.twilio_account_sid = twilioSid;
      payload.twilio_auth_token = twilioToken;
      payload.twilio_phone_number = twilioPhone;
    } else if (platform === 'whatsapp') {
      if (!twilioSid || !twilioToken || !twilioPhone) {
        toast('Please fill in all Twilio fields', { variant: 'error' });
        setSaving(false);
        return;
      }
      payload.twilio_account_sid = twilioSid;
      payload.twilio_auth_token = twilioToken;
      payload.twilio_whatsapp_number = twilioPhone;
      payload.whatsapp_method = 'twilio';
    } else if (platform === 'discord') {
      if (!discordToken) {
        toast('Please enter your Discord bot token', { variant: 'error' });
        setSaving(false);
        return;
      }
      payload.discord_bot_token = discordToken;
    }

    const result = await apiFetch('/api/v1/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (result.success) {
      toast(`${platform} configured!`, { variant: 'success' });
      setStep('done');
      await checkCredentials();
    } else {
      toast(result.error || 'Failed to save', { variant: 'error' });
    }
    setSaving(false);
  };

  const handleDone = () => {
    navigate('/compose', { replace: true });
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Welcome to ChronoSend!</CardTitle>
            <CardDescription className="text-base mt-2">
              Before you can send messages, you need to configure at least one delivery method.
              Let's get you set up in under a minute.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm font-medium text-center text-muted-foreground">
              Choose your first delivery method:
            </p>
            <div className="grid gap-3">
              {platforms.map((p) => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.value}
                    onClick={() => { setPlatform(p.value); setStep('setup'); }}
                    className="flex items-center gap-4 rounded-xl border-2 border-transparent bg-card p-4 text-left transition-all hover:border-primary hover:bg-accent group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-center text-muted-foreground pt-2">
              You can always add more delivery methods later in Settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">You're all set!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your {platform} configuration was saved successfully.
              You can now start scheduling messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDone} className="w-full" size="lg">
              <Send className="mr-2 h-4 w-4" /> Send your first message
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {platform === 'email' && <Mail className="h-5 w-5 text-primary" />}
            {platform === 'telegram' && <Send className="h-5 w-5 text-primary" />}
            {platform === 'sms' && <Phone className="h-5 w-5 text-primary" />}
            {platform === 'whatsapp' && <MessageSquare className="h-5 w-5 text-primary" />}
            {platform === 'discord' && <Headphones className="h-5 w-5 text-primary" />}
            Configure {platform.charAt(0).toUpperCase() + platform.slice(1)}
          </CardTitle>
          <CardDescription>
            {platform === 'email' && (
              <>Enter your email address and a <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google App Password</a> (or SMTP credentials).</>
            )}
            {platform === 'telegram' && (
              <>Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">@BotFather</a> and paste the token below.</>
            )}
            {platform === 'sms' && <>Enter your Twilio credentials for sending SMS messages.</>}
            {platform === 'whatsapp' && <>Enter your Twilio WhatsApp Sandbox credentials.</>}
            {platform === 'discord' && (
              <>Create a bot at the <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Discord Developer Portal</a>, enable Message Content intent, and paste the bot token below.</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {platform === 'email' && (
            <>
              <Input label="Email Address" type="email" placeholder="your@gmail.com" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
              <Input label="App Password" type="password" placeholder="abcd efgh ijkl mnop" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} helperText="Generate from Google App Passwords (no spaces needed)" />
            </>
          )}
          {platform === 'telegram' && (
            <Input label="Bot Token" type="password" placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11" value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} />
          )}
          {platform === 'discord' && (
            <Input label="Bot Token" type="password" placeholder="your_discord_bot_token" value={discordToken} onChange={(e) => setDiscordToken(e.target.value)} />
          )}
          {(platform === 'sms' || platform === 'whatsapp') && (
            <>
              <Input label="Account SID" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} />
              <Input label="Auth Token" type="password" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={twilioToken} onChange={(e) => setTwilioToken(e.target.value)} />
              <Input label="Phone Number" placeholder="+1234567890" value={twilioPhone} onChange={(e) => setTwilioPhone(e.target.value)} helperText="E.164 format (e.g. +1234567890)" />
            </>
          )}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} loading={saving} className="flex-1">
              <Check className="mr-2 h-4 w-4" /> Save & Continue
            </Button>
            <Button variant="outline" onClick={() => setStep('intro')}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
