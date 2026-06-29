import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../hooks/use-toast';
import { Send, Mail, MessageSquare, Phone, Shield, Save, Headphones } from 'lucide-react';

interface Credentials {
  email_address: string | null;
  twilio_phone_number: string | null;
  twilio_whatsapp_number: string | null;
  whatsapp_method: string;
  timezone: string;
  telegram_bot_token_preview: string | null;
  email_app_password_preview: string | null;
  twilio_account_sid_preview: string | null;
  twilio_auth_token_preview: string | null;
  discord_bot_token_preview: string | null;
}

const timezones = Intl.supportedValuesOf?.('timeZone') || [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland',
];

export function SettingsPage() {
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [loading, setLoading] = useState(true);

  // Telegram
  const [telegramToken, setTelegramToken] = useState('');
  // Email
  const [emailAddress, setEmailAddress] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  // Twilio
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');
  const [twilioWhatsapp, setTwilioWhatsapp] = useState('');
  const [whatsappMethod, setWhatsappMethod] = useState('twilio');
  // Discord
  const [discordToken, setDiscordToken] = useState('');
  // Timezone
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    const result = await apiFetch<Credentials>('/api/v1/settings');
    if (result.success && result.data) {
      setCreds(result.data);
      setEmailAddress(result.data.email_address || '');
      setTwilioPhone(result.data.twilio_phone_number || '');
      setTwilioWhatsapp(result.data.twilio_whatsapp_number || '');
      setWhatsappMethod(result.data.whatsapp_method || 'twilio');
      setTimezone(result.data.timezone || 'UTC');
    }
    setLoading(false);
  };

  const saveSection = async (section: string, data: Record<string, unknown>) => {
    const result = await apiFetch('/api/v1/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (result.success) {
      toast(`${section} settings saved`, { variant: 'success' });
      loadCredentials();
    } else {
      toast(result.error || 'Failed to save', { variant: 'error' });
    }
  };

  const testPlatform = async (platform: string) => {
    toast(`Testing ${platform}...`, { variant: 'default' });
    const result = await apiFetch(`/api/v1/settings/test/${platform}`, { method: 'POST' });
    if (result.success) {
      toast(`${platform} test successful!`, { variant: 'success' });
    } else {
      toast(result.error || `${platform} test failed`, { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  const previewValue = (val: string | null | undefined) => val || 'Not configured';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="telegram">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="telegram" className="gap-2">
            <Send className="h-4 w-4" /> Telegram
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <Phone className="h-4 w-4" /> SMS
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="h-4 w-4" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="discord" className="gap-2">
            <Headphones className="h-4 w-4" /> Discord
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Shield className="h-4 w-4" /> General
          </TabsTrigger>
        </TabsList>

        {/* Telegram */}
        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <CardTitle>Telegram Configuration</CardTitle>
              <CardDescription>
                Create a bot via{' '}
                <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  @BotFather
                </a>{' '}
                and paste the bot token below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Current: {previewValue(creds?.telegram_bot_token_preview)}
              </p>
              <Input
                label="Bot Token"
                type="password"
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
              />
              <div className="flex gap-3">
                <Button onClick={() => saveSection('Telegram', { telegram_bot_token: telegramToken })} disabled={!telegramToken}>
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
                <Button variant="outline" onClick={() => testPlatform('telegram')}>
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Use a Gmail App Password. Generate one at{' '}
                <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Google App Passwords
                </a>
                .
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Email: {previewValue(creds?.email_address)} | Password: {previewValue(creds?.email_app_password_preview)}
              </p>
              <Input label="Email Address" type="email" placeholder="your@gmail.com" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
              <Input label="App Password" type="password" placeholder="16-char app password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} helperText="No spaces. Looks like: abcd efgh ijkl mnop" />
              <div className="flex gap-3">
                <Button onClick={() => saveSection('Email', { email_address: emailAddress, email_app_password: emailPassword })} disabled={!emailAddress || !emailPassword}>
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
                <Button variant="outline" onClick={() => testPlatform('email')}>
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>SMS Configuration (Twilio)</CardTitle>
              <CardDescription>
                Enter your Twilio Account SID, Auth Token, and a verified sender phone number.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                SID: {previewValue(creds?.twilio_account_sid_preview)} | Phone: {previewValue(creds?.twilio_phone_number)}
              </p>
              <Input label="Account SID" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={twilioSid} onChange={(e) => setTwilioSid(e.target.value)} />
              <Input label="Auth Token" type="password" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={twilioToken} onChange={(e) => setTwilioToken(e.target.value)} />
              <Input label="Phone Number" placeholder="+1234567890" value={twilioPhone} onChange={(e) => setTwilioPhone(e.target.value)} helperText="Must be in E.164 format" />
              <div className="flex gap-3">
                <Button onClick={() => saveSection('SMS', { twilio_account_sid: twilioSid, twilio_auth_token: twilioToken, twilio_phone_number: twilioPhone })} disabled={!twilioSid || !twilioToken}>
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
                <Button variant="outline" onClick={() => testPlatform('sms')}>
                  Test SMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp */}
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Configuration</CardTitle>
              <CardDescription>
                Use Twilio WhatsApp Sandbox (same Twilio credentials) or a local Baileys bridge.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Method: {creds?.whatsapp_method} | Number: {previewValue(creds?.twilio_whatsapp_number)}
              </p>
              <Select
                label="WhatsApp Method"
                value={whatsappMethod}
                onChange={(e) => setWhatsappMethod(e.target.value)}
                options={[
                  { value: 'twilio', label: 'Twilio WhatsApp Sandbox' },
                  { value: 'baileys', label: 'Local Baileys Bridge' },
                ]}
              />
              <Input label="WhatsApp Number (for Twilio)" placeholder="+1234567890" value={twilioWhatsapp} onChange={(e) => setTwilioWhatsapp(e.target.value)} helperText="Twilio WhatsApp-enabled number" />
              <div className="flex gap-3">
                <Button onClick={() => saveSection('WhatsApp', { twilio_whatsapp_number: twilioWhatsapp, whatsapp_method: whatsappMethod, twilio_account_sid: twilioSid, twilio_auth_token: twilioToken })}>
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
                <Button variant="outline" onClick={() => testPlatform('whatsapp')}>
                  Test WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discord */}
        <TabsContent value="discord">
          <Card>
            <CardHeader>
              <CardTitle>Discord Configuration</CardTitle>
              <CardDescription>
                Create a bot at the{' '}
                <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Discord Developer Portal
                </a>
                , enable the Message Content intent, and paste the bot token below. Invite the bot to your server with `Send Messages` permission.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Current: {previewValue(creds?.discord_bot_token_preview)}
              </p>
              <Input
                label="Bot Token"
                type="password"
                placeholder="your_discord_bot_token"
                value={discordToken}
                onChange={(e) => setDiscordToken(e.target.value)}
              />
              <div className="flex gap-3">
                <Button onClick={() => saveSection('Discord', { discord_bot_token: discordToken })} disabled={!discordToken}>
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
                <Button variant="outline" onClick={() => testPlatform('discord')}>
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Timezone preferences and account info.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={timezones.map((tz) => ({ value: tz, label: tz }))}
              />
              <Button onClick={() => saveSection('Timezone', { timezone })}>
                <Save className="mr-2 h-4 w-4" /> Save Timezone
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
